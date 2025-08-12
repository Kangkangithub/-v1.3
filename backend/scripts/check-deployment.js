const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 部署环境检查脚本
class DeploymentChecker {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.dbPath = path.join(this.projectRoot, 'data/military-knowledge.db');
        this.uploadsDir = path.join(this.projectRoot, 'uploads/weapons/videos');
    }

    // 执行完整检查
    async checkAll() {
        console.log('🔍 开始部署环境检查...\n');

        const results = {
            database: await this.checkDatabase(),
            directories: await this.checkDirectories(),
            videoFiles: await this.checkVideoFiles(),
            permissions: await this.checkPermissions()
        };

        this.printSummary(results);
        return results;
    }

    // 检查数据库
    async checkDatabase() {
        console.log('📊 检查数据库...');
        
        try {
            if (!fs.existsSync(this.dbPath)) {
                console.log('❌ 数据库文件不存在');
                return { status: 'error', message: '数据库文件不存在' };
            }

            const db = new Database(this.dbPath);
            
            // 检查weapon_videos表
            const tableExists = db.prepare(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='weapon_videos'
            `).get();

            if (!tableExists) {
                console.log('❌ weapon_videos表不存在');
                db.close();
                return { status: 'error', message: 'weapon_videos表不存在' };
            }

            // 检查视频记录数量
            const videoCount = db.prepare(`
                SELECT COUNT(*) as count FROM weapon_videos
            `).get().count;

            console.log(`✅ 数据库正常，包含 ${videoCount} 个视频记录`);
            
            db.close();
            return { status: 'success', count: videoCount };

        } catch (error) {
            console.log(`❌ 数据库检查失败: ${error.message}`);
            return { status: 'error', message: error.message };
        }
    }

    // 检查目录结构
    async checkDirectories() {
        console.log('\n📁 检查目录结构...');
        
        const requiredDirs = [
            'uploads',
            'uploads/weapons',
            'uploads/weapons/videos',
            'data'
        ];

        const results = [];

        for (const dir of requiredDirs) {
            const fullPath = path.join(this.projectRoot, dir);
            const exists = fs.existsSync(fullPath);
            
            if (exists) {
                console.log(`✅ ${dir} 目录存在`);
                results.push({ dir, status: 'exists' });
            } else {
                console.log(`❌ ${dir} 目录不存在，正在创建...`);
                try {
                    fs.mkdirSync(fullPath, { recursive: true });
                    console.log(`✅ ${dir} 目录创建成功`);
                    results.push({ dir, status: 'created' });
                } catch (error) {
                    console.log(`❌ ${dir} 目录创建失败: ${error.message}`);
                    results.push({ dir, status: 'error', message: error.message });
                }
            }
        }

        return results;
    }

    // 检查视频文件
    async checkVideoFiles() {
        console.log('\n🎥 检查视频文件...');
        
        try {
            const db = new Database(this.dbPath);
            const videos = db.prepare(`
                SELECT id, filename, file_path, original_name 
                FROM weapon_videos
            `).all();

            if (videos.length === 0) {
                console.log('ℹ️ 没有视频文件需要检查');
                db.close();
                return { status: 'empty', count: 0 };
            }

            let validFiles = 0;
            let invalidFiles = 0;
            const issues = [];

            for (const video of videos) {
                const fullPath = path.isAbsolute(video.file_path) 
                    ? video.file_path 
                    : path.join(this.projectRoot, video.file_path);

                if (fs.existsSync(fullPath)) {
                    validFiles++;
                    console.log(`✅ 视频文件存在: ${video.filename}`);
                } else {
                    invalidFiles++;
                    console.log(`❌ 视频文件缺失: ${video.filename} (${video.file_path})`);
                    issues.push({
                        id: video.id,
                        filename: video.filename,
                        path: video.file_path,
                        issue: 'file_missing'
                    });
                }
            }

            console.log(`\n📊 视频文件检查结果:`);
            console.log(`有效文件: ${validFiles} 个`);
            console.log(`缺失文件: ${invalidFiles} 个`);

            db.close();
            return { 
                status: invalidFiles > 0 ? 'warning' : 'success', 
                valid: validFiles, 
                invalid: invalidFiles,
                issues 
            };

        } catch (error) {
            console.log(`❌ 视频文件检查失败: ${error.message}`);
            return { status: 'error', message: error.message };
        }
    }

    // 检查权限
    async checkPermissions() {
        console.log('\n🔐 检查文件权限...');
        
        const testFile = path.join(this.uploadsDir, 'test-permission.tmp');
        
        try {
            // 测试写权限
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            
            console.log('✅ 上传目录具有读写权限');
            return { status: 'success', writable: true };
            
        } catch (error) {
            console.log(`❌ 权限检查失败: ${error.message}`);
            return { status: 'error', writable: false, message: error.message };
        }
    }

    // 打印检查摘要
    printSummary(results) {
        console.log('\n' + '='.repeat(50));
        console.log('📋 部署检查摘要');
        console.log('='.repeat(50));

        // 数据库状态
        console.log(`数据库: ${results.database.status === 'success' ? '✅ 正常' : '❌ 异常'}`);
        
        // 目录状态
        const dirIssues = results.directories.filter(d => d.status === 'error').length;
        console.log(`目录结构: ${dirIssues === 0 ? '✅ 正常' : `❌ ${dirIssues} 个问题`}`);
        
        // 视频文件状态
        if (results.videoFiles.status === 'empty') {
            console.log('视频文件: ℹ️ 无文件');
        } else if (results.videoFiles.status === 'success') {
            console.log('视频文件: ✅ 全部正常');
        } else {
            console.log(`视频文件: ⚠️ ${results.videoFiles.invalid} 个文件缺失`);
        }
        
        // 权限状态
        console.log(`文件权限: ${results.permissions.status === 'success' ? '✅ 正常' : '❌ 异常'}`);

        // 总体状态
        const hasErrors = results.database.status === 'error' || 
                         results.directories.some(d => d.status === 'error') ||
                         results.permissions.status === 'error';
        
        const hasWarnings = results.videoFiles.status === 'warning';

        console.log('\n' + '='.repeat(50));
        if (hasErrors) {
            console.log('🚨 部署检查发现严重问题，需要修复后才能正常运行');
        } else if (hasWarnings) {
            console.log('⚠️ 部署检查发现警告，建议修复以获得最佳体验');
        } else {
            console.log('🎉 部署检查通过，系统可以正常运行');
        }
        console.log('='.repeat(50));
    }

    // 修复常见问题
    async autoFix() {
        console.log('🔧 开始自动修复...\n');

        // 创建缺失的目录
        await this.checkDirectories();

        // 运行路径迁移
        console.log('\n🔄 执行路径迁移...');
        try {
            const VideoPathMigration = require('./migrate-video-paths');
            const migration = new VideoPathMigration();
            await migration.migrate();
        } catch (error) {
            console.log(`❌ 路径迁移失败: ${error.message}`);
        }

        console.log('\n✅ 自动修复完成');
    }
}

// 命令行执行
if (require.main === module) {
    const checker = new DeploymentChecker();
    
    const command = process.argv[2];
    
    if (command === 'fix') {
        checker.autoFix().catch(console.error);
    } else {
        checker.checkAll().catch(console.error);
    }
}

module.exports = DeploymentChecker;