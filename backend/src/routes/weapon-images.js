const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const databaseManager = require('../config/database-simple');
const logger = require('../utils/logger');

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/weapons');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'weapon-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// 获取武器的所有图片
router.get('/:weaponId', async (req, res) => {
  try {
    let weaponId = req.params.weaponId;
    logger.info(`获取武器图片请求，原始武器ID: ${weaponId}`);
    
    // 处理ID格式转换
    if (typeof weaponId === 'string') {
      if (weaponId.startsWith('weapon_')) {
        weaponId = weaponId.replace('weapon_', '');
      } else if (weaponId.includes('_')) {
        const parts = weaponId.split('_');
        weaponId = parts[parts.length - 1];
      }
    }
    
    // 确保ID是数字
    weaponId = parseInt(weaponId);
    if (isNaN(weaponId)) {
      logger.warn(`无效的武器ID格式: ${req.params.weaponId}`);
      return res.status(400).json({
        success: false,
        message: '无效的武器ID格式'
      });
    }
    
    logger.info(`处理后的武器ID: ${weaponId}`);
    
    const db = databaseManager.getDatabase();
    if (!db) {
      logger.error('数据库连接未初始化');
      return res.status(500).json({
        success: false,
        message: '数据库连接错误'
      });
    }

    const weapon = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, images FROM weapons WHERE id = ?', [weaponId], (err, row) => {
        if (err) {
          logger.error('数据库查询错误:', err);
          reject(err);
        } else {
          logger.info(`数据库查询结果:`, row);
          resolve(row);
        }
      });
    });

    if (!weapon) {
      logger.warn(`武器不存在，ID: ${weaponId}`);
      return res.status(404).json({
        success: false,
        message: '武器不存在'
      });
    }

    let images = [];
    try {
      images = weapon.images ? JSON.parse(weapon.images) : [];
      logger.info(`解析到 ${images.length} 张图片`);
    } catch (e) {
      logger.warn('解析武器图片数据失败:', e);
      images = [];
    }

    res.json({
      success: true,
      data: {
        weaponId: weaponId,
        weaponName: weapon.name,
        images: images
      }
    });
  } catch (error) {
    logger.error('获取武器图片失败:', error);
    res.status(500).json({
      success: false,
      message: '获取武器图片失败',
      error: error.message
    });
  }
});

// 上传武器图片
router.post('/:weaponId', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const weaponId = req.params.weaponId;
    const { description } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片'
      });
    }

    const db = databaseManager.getDatabase();

    // 检查武器是否存在
    const weapon = await new Promise((resolve, reject) => {
      db.get('SELECT images FROM weapons WHERE id = ?', [weaponId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!weapon) {
      // 删除已上传的文件
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: '武器不存在'
      });
    }

    // 解析现有图片数据
    let images = [];
    try {
      images = weapon.images ? JSON.parse(weapon.images) : [];
    } catch (e) {
      logger.warn('解析现有图片数据失败:', e);
      images = [];
    }

    // 添加新图片信息
    const newImage = {
      id: Date.now(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/uploads/weapons/${req.file.filename}`,
      size: req.file.size,
      description: description || '',
      uploadedAt: new Date().toISOString()
    };

    images.push(newImage);

    // 更新数据库
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE weapons SET images = ?, updated_at = datetime("now") WHERE id = ?',
        [JSON.stringify(images), weaponId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    logger.info(`武器图片上传成功: 武器ID ${weaponId}, 文件 ${req.file.filename}`);

    res.json({
      success: true,
      message: '图片上传成功',
      data: {
        image: newImage
      }
    });
  } catch (error) {
    logger.error('上传武器图片失败:', error);
    // 清理上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: '上传图片失败'
    });
  }
});

// 删除武器图片
router.delete('/:weaponId/:imageId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const weaponId = req.params.weaponId;
    const imageId = parseInt(req.params.imageId);

    const db = databaseManager.getDatabase();

    // 获取武器图片数据
    const weapon = await new Promise((resolve, reject) => {
      db.get('SELECT images FROM weapons WHERE id = ?', [weaponId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!weapon) {
      return res.status(404).json({
        success: false,
        message: '武器不存在'
      });
    }

    // 解析图片数据
    let images = [];
    try {
      images = weapon.images ? JSON.parse(weapon.images) : [];
    } catch (e) {
      logger.warn('解析图片数据失败:', e);
      images = [];
    }

    // 查找要删除的图片
    const imageIndex = images.findIndex(img => img.id === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }

    const imageToDelete = images[imageIndex];

    // 删除文件系统中的图片文件
    const filePath = path.join(__dirname, '../../uploads/weapons', imageToDelete.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 从数组中移除图片
    images.splice(imageIndex, 1);

    // 更新数据库
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE weapons SET images = ?, updated_at = datetime("now") WHERE id = ?',
        [JSON.stringify(images), weaponId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    logger.info(`武器图片删除成功: 武器ID ${weaponId}, 图片ID ${imageId}`);

    res.json({
      success: true,
      message: '图片删除成功'
    });
  } catch (error) {
    logger.error('删除武器图片失败:', error);
    res.status(500).json({
      success: false,
      message: '删除图片失败'
    });
  }
});

// 更新图片描述
router.put('/:weaponId/:imageId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const weaponId = req.params.weaponId;
    const imageId = parseInt(req.params.imageId);
    const { description } = req.body;

    const db = databaseManager.getDatabase();

    // 获取武器图片数据
    const weapon = await new Promise((resolve, reject) => {
      db.get('SELECT images FROM weapons WHERE id = ?', [weaponId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!weapon) {
      return res.status(404).json({
        success: false,
        message: '武器不存在'
      });
    }

    // 解析图片数据
    let images = [];
    try {
      images = weapon.images ? JSON.parse(weapon.images) : [];
    } catch (e) {
      logger.warn('解析图片数据失败:', e);
      images = [];
    }

    // 查找要更新的图片
    const imageIndex = images.findIndex(img => img.id === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }

    // 更新图片描述
    images[imageIndex].description = description || '';
    images[imageIndex].updatedAt = new Date().toISOString();

    // 更新数据库
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE weapons SET images = ?, updated_at = datetime("now") WHERE id = ?',
        [JSON.stringify(images), weaponId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    logger.info(`武器图片描述更新成功: 武器ID ${weaponId}, 图片ID ${imageId}`);

    res.json({
      success: true,
      message: '图片描述更新成功',
      data: {
        image: images[imageIndex]
      }
    });
  } catch (error) {
    logger.error('更新图片描述失败:', error);
    res.status(500).json({
      success: false,
      message: '更新图片描述失败'
    });
  }
});

module.exports = router;