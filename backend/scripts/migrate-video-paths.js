const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库路径迁移脚本
class VideoPathMigration {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/military-knowledge.db');
        this.db = new Database(this.dbPath);
        this.projectRoot = path.join(__dirname, '..');
    }

    // 执行路径迁移
    async migrate() {
        console.log('开始武器视频路径迁移...');
        
        try {
            // 获取所有视频记录
            const videos = this.db.prepare(`
                SELECT id, file_path, filename 
                FROM weapon_videos 
                WHERE file_path IS NOT NULL
            `).all();

            console.log(`找到 ${videos.length} 个视频记录需要迁移`);

            let migratedCount = 0;
            let errorCount = 0;

            // 开始事务
            const updateStmt = this.db.prepare(`
                UPDATE weapon_videos 
                SET file_path = ?
                WHERE id = ?
            `);

            const transaction = this.db.transaction((videos) => {
                for (const video of videos) {
                    try {
                        let newPath;
                        
                        // 如果已经是相对路径，跳过
                        if (!path.isAbsolute(video.file_path)) {
                            console.log(`视频 ${video.id} 已经是相对路径，跳过`);
                            continue;
                        }

                        // 检查文件是否存在
                        if (fs.existsSync(video.file_path)) {
                            // 转换为相对路径
                            newPath = path.relative(this.projectRoot, video.file_path);
                        } else {
                            // 如果原文件不存在，尝试构建标准路径
                            newPath = path.join('uploads', 'weapons', 'videos', video.filename);
                            console.log(`原文件不存在，使用标准路径: ${newPath}`);
                        }

                        // 更新数据库
                        updateStmt.run(newPath, video.id);
                        migratedCount++;
                        
                        console.log(`✓ 视频 ${video.id}: ${video.file_path} -> ${newPath}`);
                        
                    } catch (error) {
                        console.error(`✗ 迁移视频 ${video.id} 失败:`, error.message);
                        errorCount++;
                    }
                }
            });

            // 执行事务
            transaction(videos);

            console.log('\n迁移完成！');
            console.log(`成功迁移: ${migratedCount} 个`);
            console.log(`失败: ${errorCount} 个`);

            // 验证迁移结果
            await this.verifyMigration();

        } catch (error) {
            console.error('迁移过程中发生错误:', error);
            throw error;
        } finally {
            this.db.close();
        }
    }

    // 验证迁移结果
    async verifyMigration() {
        console.log('\n验证迁移结果...');
        
        const videos = this.db.prepare(`
            SELECT id, file_path, filename 
            FROM weapon_videos 
            WHERE file_path IS NOT NULL
        `).all();

        let validCount = 0;
        let invalidCount = 0;

        for (const video of videos) {
            const fullPath = path.isAbsolute(video.file_path) 
                ? video.file_path 
                : path.join(this.projectRoot, video.file_path);

            if (fs.existsSync(fullPath)) {
                validCount++;
            } else {
                console.log(`⚠ 文件不存在: ${video.file_path} (ID: ${video.id})`);
                invalidCount++;
            }
        }

        console.log(`\n验证结果:`);
        console.log(`有效文件: ${validCount} 个`);
        console.log(`无效文件: ${invalidCount} 个`);
    }

    // 回滚迁移（如果需要）
    async rollback() {
        console.log('开始回滚路径迁移...');
        
        try {
            const videos = this.db.prepare(`
                SELECT id, file_path, filename 
                FROM weapon_videos 
                WHERE file_path IS NOT NULL
            `).all();

            const updateStmt = this.db.prepare(`
                UPDATE weapon_videos 
                SET file_path = ?
                WHERE id = ?
            `);

            const transaction = this.db.transaction((videos) => {
                for (const video of videos) {
                    if (!path.isAbsolute(video.file_path)) {
                        const absolutePath = path.join(this.projectRoot, video.file_path);
                        updateStmt.run(absolutePath, video.id);
                        console.log(`回滚视频 ${video.id}: ${video.file_path} -> ${absolutePath}`);
                    }
                }
            });

            transaction(videos);
            console.log('回滚完成！');

        } catch (error) {
            console.error('回滚过程中发生错误:', error);
            throw error;
        } finally {
            this.db.close();
        }
    }
}

// 命令行执行
if (require.main === module) {
    const migration = new VideoPathMigration();
    
    const command = process.argv[2];
    
    if (command === 'rollback') {
        migration.rollback().catch(console.error);
    } else {
        migration.migrate().catch(console.error);
    }
}

module.exports = VideoPathMigration;