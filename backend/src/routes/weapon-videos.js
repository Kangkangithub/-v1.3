const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const router = express.Router();

// 数据库连接
const db = new Database(path.join(__dirname, '../../data/military-knowledge.db'));

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads/weapons/videos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer用于视频上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'weapon-video-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 视频文件过滤器
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('只支持 MP4, AVI, MOV, WMV, FLV, WebM 格式的视频文件'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB 限制
    }
});

// 创建weapon_videos表（如果不存在）
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS weapon_videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            weapon_id INTEGER NOT NULL,
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            file_size INTEGER,
            mime_type VARCHAR(100),
            duration INTEGER,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (weapon_id) REFERENCES weapons(id) ON DELETE CASCADE
        )
    `);
    console.log('weapon_videos 表已创建或已存在');
} catch (error) {
    console.error('创建 weapon_videos 表失败:', error);
}

// 获取指定武器的所有视频
router.get('/weapon/:weaponId', (req, res) => {
    try {
        const weaponId = parseInt(req.params.weaponId);
        
        if (!weaponId || weaponId <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: '无效的武器ID' 
            });
        }

        const videos = db.prepare(`
            SELECT id, weapon_id, filename, original_name, file_path, file_size, 
                   mime_type, duration, description, upload_time
            FROM weapon_videos 
            WHERE weapon_id = ?
            ORDER BY upload_time DESC
        `).all(weaponId);

        res.json({
            success: true,
            data: videos
        });
    } catch (error) {
        console.error('获取武器视频失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '获取武器视频失败' 
        });
    }
});

// 上传视频
router.post('/weapon/:weaponId/upload', upload.single('video'), (req, res) => {
    try {
        const weaponId = parseInt(req.params.weaponId);
        const file = req.file;
        const description = req.body.description || '';

        if (!weaponId || weaponId <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: '无效的武器ID' 
            });
        }

        if (!file) {
            return res.status(400).json({ 
                success: false, 
                message: '请选择要上传的视频文件' 
            });
        }

        // 验证武器是否存在
        const weapon = db.prepare('SELECT id FROM weapons WHERE id = ?').get(weaponId);
        if (!weapon) {
            // 删除已上传的文件
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            return res.status(404).json({ 
                success: false, 
                message: '武器不存在' 
            });
        }

        // 保存视频信息到数据库
        const stmt = db.prepare(`
            INSERT INTO weapon_videos (weapon_id, filename, original_name, file_path, file_size, mime_type, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            weaponId,
            file.filename,
            file.originalname,
            file.path,
            file.size,
            file.mimetype,
            description
        );

        res.json({
            success: true,
            message: '视频上传成功',
            data: {
                id: result.lastInsertRowid,
                filename: file.filename,
                originalName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                description: description
            }
        });

    } catch (error) {
        console.error('上传视频失败:', error);
        
        // 如果有文件上传，删除文件
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            success: false, 
            message: '上传视频失败: ' + error.message 
        });
    }
});

// 获取视频文件流
router.get('/file/:filename', (req, res) => {
    try {
        const filename = req.params.filename;

        if (!filename) {
            return res.status(400).json({ 
                success: false, 
                message: '无效的文件名' 
            });
        }

        // 从数据库获取视频信息
        const video = db.prepare(`
            SELECT file_path, filename, mime_type, file_size
            FROM weapon_videos 
            WHERE filename = ?
        `).get(filename);

        if (!video) {
            return res.status(404).json({ 
                success: false, 
                message: '视频不存在' 
            });
        }

        // 检查文件是否存在
        if (!fs.existsSync(video.file_path)) {
            return res.status(404).json({ 
                success: false, 
                message: '视频文件不存在' 
            });
        }

        const stat = fs.statSync(video.file_path);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            // 支持视频流播放
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(video.file_path, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': video.mime_type,
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': video.mime_type,
            };
            res.writeHead(200, head);
            fs.createReadStream(video.file_path).pipe(res);
        }

    } catch (error) {
        console.error('获取视频文件失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '获取视频文件失败' 
        });
    }
});

// 更新视频信息
router.put('/:videoId', (req, res) => {
    try {
        const videoId = parseInt(req.params.videoId);
        const { description } = req.body;

        if (!videoId) {
            return res.status(400).json({ 
                success: false, 
                message: '无效的视频ID' 
            });
        }

        // 验证视频是否存在
        const video = db.prepare(`
            SELECT id FROM weapon_videos 
            WHERE id = ?
        `).get(videoId);

        if (!video) {
            return res.status(404).json({ 
                success: false, 
                message: '视频不存在' 
            });
        }

        // 更新视频描述
        const stmt = db.prepare(`
            UPDATE weapon_videos 
            SET description = ?
            WHERE id = ?
        `);

        stmt.run(description || '', videoId);

        res.json({
            success: true,
            message: '视频信息更新成功'
        });

    } catch (error) {
        console.error('更新视频信息失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '更新视频信息失败' 
        });
    }
});

// 删除视频
router.delete('/:videoId', (req, res) => {
    try {
        const videoId = parseInt(req.params.videoId);

        if (!videoId) {
            return res.status(400).json({ 
                success: false, 
                message: '无效的视频ID' 
            });
        }

        // 获取视频信息
        const video = db.prepare(`
            SELECT file_path FROM weapon_videos 
            WHERE id = ?
        `).get(videoId);

        if (!video) {
            return res.status(404).json({ 
                success: false, 
                message: '视频不存在' 
            });
        }

        // 删除数据库记录
        const stmt = db.prepare(`
            DELETE FROM weapon_videos 
            WHERE id = ?
        `);
        
        const result = stmt.run(videoId);

        if (result.changes > 0) {
            // 删除文件
            if (fs.existsSync(video.file_path)) {
                fs.unlinkSync(video.file_path);
            }

            res.json({
                success: true,
                message: '视频删除成功'
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: '视频不存在' 
            });
        }

    } catch (error) {
        console.error('删除视频失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '删除视频失败' 
        });
    }
});

// 获取武器视频统计信息
router.get('/weapon/:weaponId/stats', (req, res) => {
    try {
        const weaponId = parseInt(req.params.weaponId);

        if (!weaponId || weaponId <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: '无效的武器ID' 
            });
        }

        const stats = db.prepare(`
            SELECT 
                COUNT(*) as total_videos,
                SUM(file_size) as total_size,
                AVG(file_size) as avg_size
            FROM weapon_videos 
            WHERE weapon_id = ?
        `).get(weaponId);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('获取视频统计失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '获取视频统计失败' 
        });
    }
});

module.exports = router;