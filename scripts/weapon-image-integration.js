// 武器图片管理集成脚本
class WeaponImageManager {
    constructor() {
        this.currentWeaponId = null;
        this.currentWeaponName = null;
        this.isUploading = false;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // 上传按钮点击事件
        document.getElementById('uploadImageBtn')?.addEventListener('click', () => {
            this.toggleUploadArea();
        });

        // 确认上传按钮
        document.getElementById('confirmUploadBtn')?.addEventListener('click', () => {
            this.uploadImage();
        });

        // 取消上传按钮
        document.getElementById('cancelUploadBtn')?.addEventListener('click', () => {
            this.hideUploadArea();
        });

        // 文件选择事件
        document.getElementById('weaponImageFile')?.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });
    }

    // 显示武器图片管理区域
    showWeaponImageSection(weaponId, weaponName) {
        this.currentWeaponId = weaponId;
        this.currentWeaponName = weaponName;
        
        const section = document.getElementById('weaponImageSection');
        if (section) {
            section.style.display = 'block';
            this.loadWeaponImages();
        }
    }

    // 显示武器图片（兼容knowledge-graph.js调用）
    showWeaponImages(weaponId, weaponName) {
        this.showWeaponImageSection(weaponId, weaponName);
    }

    // 显示上传对话框（兼容knowledge-graph.js调用）
    showUploadDialog(weaponId, weaponName) {
        this.currentWeaponId = weaponId;
        this.currentWeaponName = weaponName;
        this.showWeaponImageSection(weaponId, weaponName);
        this.showUploadArea();
    }

    // 显示管理对话框（兼容knowledge-graph.js调用）
    showManagementDialog(weaponId, weaponName) {
        this.showWeaponImageSection(weaponId, weaponName);
    }

    // 加载武器图片缩略图（兼容knowledge-graph.js调用）
    async loadWeaponImageThumbnails(weaponId, displayArea) {
        if (!weaponId || !displayArea) return;

        displayArea.innerHTML = `
            <div class="loading-thumbnails">
                <i class="fas fa-spinner fa-spin"></i>
                <span>正在加载图片...</span>
            </div>
        `;

        try {
            const response = await fetch(`http://localhost:3001/api/weapon-images/${weaponId}`);
            const data = await response.json();

            if (data.success && data.data.images && data.data.images.length > 0) {
                // 缓存图片数据和武器信息，用于灯箱显示
                this.cachedImages = data.data.images;
                this.currentWeaponId = weaponId;
                this.currentWeaponName = data.data.weaponName;
                
                const images = data.data.images.slice(0, 3); // 只显示前3张作为缩略图
                displayArea.innerHTML = `
                    <div class="weapon-thumbnails">
                        ${images.map(image => `
                            <div class="thumbnail-item" onclick="weaponImageManager.openLightbox(${image.id})">
                                <img src="http://localhost:3001${image.path}" alt="${image.description || '武器图片'}" 
                                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA2MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMCAxNUgzMFYyNUgyMFYxNVoiIGZpbGw9IiNEREQiLz4KPHBhdGggZD0iTTIyIDE3SDI4VjIzSDIyVjE3WiIgZmlsbD0iI0JCQiIvPgo8dGV4dCB4PSIzMCIgeT0iMzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4Ij7lm77niYc8L3RleHQ+Cjwvc3ZnPg=='"
                                     style="width: 50px; height: 35px; object-fit: cover; border-radius: 4px; margin-right: 5px;">
                            </div>
                        `).join('')}
                        ${data.data.images.length > 3 ? `<div class="thumbnail-more">+${data.data.images.length - 3}</div>` : ''}
                    </div>
                `;
            } else {
                displayArea.innerHTML = `
                    <div class="no-thumbnails">
                        <i class="fas fa-image" style="color: #666; font-size: 16px;"></i>
                        <span style="color: #666; font-size: 12px; margin-left: 5px;">暂无图片</span>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载武器图片缩略图失败:', error);
            displayArea.innerHTML = `
                <div class="error-thumbnails">
                    <i class="fas fa-exclamation-triangle" style="color: #e74c3c; font-size: 16px;"></i>
                    <span style="color: #e74c3c; font-size: 12px; margin-left: 5px;">加载失败</span>
                </div>
            `;
        }
    }

    // 隐藏武器图片管理区域
    hideWeaponImageSection() {
        const section = document.getElementById('weaponImageSection');
        if (section) {
            section.style.display = 'none';
        }
        this.currentWeaponId = null;
        this.currentWeaponName = null;
        this.hideUploadArea();
    }

    // 切换上传区域显示
    toggleUploadArea() {
        const uploadArea = document.getElementById('imageUploadArea');
        if (uploadArea) {
            const isVisible = uploadArea.style.display !== 'none';
            if (isVisible) {
                this.hideUploadArea();
            } else {
                this.showUploadArea();
            }
        }
    }

    // 显示上传区域
    showUploadArea() {
        const uploadArea = document.getElementById('imageUploadArea');
        if (uploadArea) {
            uploadArea.style.display = 'block';
            // 清空表单
            document.getElementById('weaponImageFile').value = '';
            document.getElementById('weaponImageDescription').value = '';
            this.updateFileInputDisplay();
        }
    }

    // 隐藏上传区域
    hideUploadArea() {
        const uploadArea = document.getElementById('imageUploadArea');
        if (uploadArea) {
            uploadArea.style.display = 'none';
        }
    }

    // 处理文件选择
    handleFileSelect(event) {
        const file = event.target.files[0];
        this.updateFileInputDisplay(file);
    }

    // 更新文件输入显示
    updateFileInputDisplay(file = null) {
        const wrapper = document.querySelector('.file-input-wrapper');
        const content = document.querySelector('.file-input-content');
        
        if (file) {
            content.innerHTML = `
                <i class="fas fa-check-circle" style="color: #28a745;"></i>
                <div>已选择: ${file.name}</div>
                <small>${this.formatFileSize(file.size)}</small>
            `;
            wrapper.style.borderColor = '#28a745';
            wrapper.style.background = '#f8fff8';
        } else {
            content.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <div>点击选择图片文件</div>
                <small>支持 JPG, PNG, GIF, WebP 格式，最大 5MB</small>
            `;
            wrapper.style.borderColor = '#ddd';
            wrapper.style.background = 'white';
        }
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 显示消息
    showMessage(message, type = 'success') {
        const messageElement = document.getElementById('imageMessage');
        if (messageElement) {
            messageElement.className = `image-message ${type}`;
            messageElement.textContent = message;
            messageElement.style.display = 'block';
            
            // 3秒后自动隐藏成功消息
            if (type === 'success') {
                setTimeout(() => {
                    messageElement.style.display = 'none';
                }, 3000);
            }
        }
    }

    // 加载武器图片
    async loadWeaponImages() {
        if (!this.currentWeaponId) return;

        const grid = document.getElementById('weaponImagesGrid');
        if (!grid) return;

        // 显示加载状态
        grid.innerHTML = `
            <div class="loading-images">
                <i class="fas fa-spinner fa-spin"></i>
                <span>正在加载图片...</span>
            </div>
        `;

        try {
            const response = await fetch(`http://localhost:3001/api/weapon-images/${this.currentWeaponId}`);
            const data = await response.json();

            if (data.success) {
                this.cachedImages = data.data.images; // 缓存图片数据
                this.displayImages(data.data.images);
            } else {
                this.showMessage(data.message || '获取武器图片失败', 'error');
                this.displayNoImages();
            }
        } catch (error) {
            console.error('获取武器图片失败:', error);
            this.showMessage('网络错误，请检查服务器连接', 'error');
            this.displayNoImages();
        }
    }

    // 显示图片
    displayImages(images) {
        const grid = document.getElementById('weaponImagesGrid');
        if (!grid) return;

        if (!images || images.length === 0) {
            this.displayNoImages();
            return;
        }

        grid.innerHTML = images.map(image => `
            <div class="weapon-image-card">
                <div class="image-container" onclick="weaponImageManager.openLightbox(${image.id})">
                    <img src="http://localhost:3001${image.path}" alt="${image.description || '武器图片'}" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik04MCA0MEgxMjBWODBIODBWNDBaIiBmaWxsPSIjREREIi8+CjxwYXRoIGQ9Ik05MCA1MEgxMTBWNzBIOTBWNTBaIiBmaWxsPSIjQkJCIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiPuWbvueJh+aXoOazleWKoOi9vTwvdGV4dD4KPC9zdmc+'">
                    <div class="image-overlay">
                        <div class="image-actions">
                            <button class="btn-warning btn-small" onclick="event.stopPropagation(); weaponImageManager.editImage(${image.id}, '${(image.description || '').replace(/'/g, '\\\'')}')" title="编辑">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-danger btn-small" onclick="event.stopPropagation(); weaponImageManager.deleteImage(${image.id})" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="image-info">
                    <h5>${image.originalName || '未命名图片'}</h5>
                    <div class="image-meta">
                        <i class="fas fa-calendar"></i> ${new Date(image.uploadedAt).toLocaleDateString('zh-CN')}
                        <br>
                        <i class="fas fa-file"></i> ${this.formatFileSize(image.size)}
                    </div>
                    <div class="image-description">
                        ${image.description || '暂无描述'}
                    </div>
                    <div class="image-controls">
                        <button class="btn-primary btn-small" onclick="weaponImageManager.openLightbox(${image.id})" title="查看大图">
                            <i class="fas fa-search-plus"></i> 查看大图
                        </button>
                        <button class="btn-warning btn-small" onclick="weaponImageManager.editImage(${image.id}, '${(image.description || '').replace(/'/g, '\\\'')}')" title="编辑">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn-danger btn-small" onclick="weaponImageManager.deleteImage(${image.id})" title="删除">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 显示无图片状态
    displayNoImages() {
        const grid = document.getElementById('weaponImagesGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="no-images">
                    <i class="fas fa-image"></i>
                    <h5>暂无图片</h5>
                    <p>点击上方"上传图片"按钮添加第一张图片</p>
                </div>
            `;
        }
    }

    // 上传图片
    async uploadImage() {
        if (this.isUploading) return;

        const fileInput = document.getElementById('weaponImageFile');
        const description = document.getElementById('weaponImageDescription').value;

        if (!fileInput.files[0]) {
            this.showMessage('请选择要上传的图片', 'error');
            return;
        }

        if (!this.currentWeaponId) {
            this.showMessage('武器信息错误', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('description', description);

        this.isUploading = true;
        this.showMessage('正在上传图片...', 'loading');

        try {
            const response = await fetch(`http://localhost:3001/api/weapon-images/${this.currentWeaponId}`, {
                method: 'POST',
                headers: {
                    'x-admin-user': 'true' // 使用简化管理员认证
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage('图片上传成功！');
                this.hideUploadArea();
                this.loadWeaponImages(); // 重新加载图片
            } else {
                this.showMessage(data.message || '上传失败', 'error');
            }
        } catch (error) {
            console.error('上传图片失败:', error);
            this.showMessage('网络错误，请检查服务器连接', 'error');
        } finally {
            this.isUploading = false;
        }
    }

    // 编辑图片
    editImage(imageId, currentDescription) {
        // 创建编辑模态框
        const modal = this.createEditModal(imageId, currentDescription);
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    // 创建编辑模态框
    createEditModal(imageId, currentDescription) {
        const modal = document.createElement('div');
        modal.className = 'edit-image-modal';
        modal.innerHTML = `
            <div class="edit-image-modal-content">
                <div class="edit-image-modal-header">
                    <h4><i class="fas fa-edit"></i> 编辑图片</h4>
                    <span class="edit-image-modal-close">&times;</span>
                </div>
                <div class="edit-image-form-group">
                    <label for="editImageDescription">图片描述:</label>
                    <textarea id="editImageDescription" rows="4" placeholder="请输入图片描述">${currentDescription}</textarea>
                </div>
                <div class="edit-image-modal-actions">
                    <button class="btn-primary btn-small save-edit-btn">
                        <i class="fas fa-save"></i> 保存
                    </button>
                    <button class="btn-secondary btn-small cancel-edit-btn">
                        <i class="fas fa-times"></i> 取消
                    </button>
                </div>
            </div>
        `;

        // 绑定事件
        modal.querySelector('.edit-image-modal-close').onclick = () => {
            document.body.removeChild(modal);
        };

        modal.querySelector('.cancel-edit-btn').onclick = () => {
            document.body.removeChild(modal);
        };

        modal.querySelector('.save-edit-btn').onclick = () => {
            const newDescription = modal.querySelector('#editImageDescription').value;
            this.saveImageEdit(imageId, newDescription);
            document.body.removeChild(modal);
        };

        // 点击模态框外部关闭
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };

        return modal;
    }

    // 保存图片编辑
    async saveImageEdit(imageId, description) {
        if (!this.currentWeaponId) {
            this.showMessage('武器信息错误', 'error');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/api/weapon-images/${this.currentWeaponId}/${imageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-user': 'true' // 使用简化管理员认证
                },
                body: JSON.stringify({ description })
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage('图片信息更新成功！');
                this.loadWeaponImages(); // 重新加载图片
            } else {
                this.showMessage(data.message || '更新失败', 'error');
            }
        } catch (error) {
            console.error('更新图片信息失败:', error);
            this.showMessage('网络错误，请检查服务器连接', 'error');
        }
    }

    // 删除图片
    async deleteImage(imageId) {
        if (!confirm('确定要删除这张图片吗？此操作不可恢复。')) {
            return;
        }

        if (!this.currentWeaponId) {
            this.showMessage('武器信息错误', 'error');
            return;
        }

        this.showMessage('正在删除图片...', 'loading');

        try {
            const response = await fetch(`http://localhost:3001/api/weapon-images/${this.currentWeaponId}/${imageId}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-user': 'true' // 使用简化管理员认证
                }
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage('图片删除成功！');
                this.loadWeaponImages(); // 重新加载图片
                this.closeLightbox(); // 如果灯箱打开，关闭它
            } else {
                this.showMessage(data.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除图片失败:', error);
            this.showMessage('网络错误，请检查服务器连接', 'error');
        }
    }

    // 打开灯箱
    openLightbox(imageId) {
        const images = this.getCurrentImages();
        const image = images.find(img => img.id === imageId);
        
        if (!image) {
            this.showMessage('图片不存在', 'error');
            return;
        }

        // 创建灯箱HTML
        const lightboxHtml = `
            <div class="weapon-image-lightbox" id="weaponImageLightbox">
                <div class="lightbox-content">
                    <button class="lightbox-close" onclick="weaponImageManager.closeLightbox()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="lightbox-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>加载中...</span>
                    </div>
                    <img class="lightbox-image" 
                         src="http://localhost:3001${image.path}" 
                         alt="${image.description || '武器图片'}"
                         onload="this.previousElementSibling.style.display='none'"
                         onerror="weaponImageManager.handleLightboxImageError(this)">
                    <div class="lightbox-info">
                        <div class="lightbox-title">
                            <i class="fas fa-image"></i>
                            ${image.originalName || '未命名图片'}
                        </div>
                        <div class="lightbox-description">
                            ${image.description || '暂无描述'}
                        </div>
                        <div class="lightbox-meta">
                            <span><i class="fas fa-calendar"></i> ${new Date(image.uploadedAt).toLocaleDateString('zh-CN')}</span>
                            <span><i class="fas fa-file"></i> ${this.formatFileSize(image.size)}</span>
                            <span><i class="fas fa-tag"></i> ${this.currentWeaponName}</span>
                        </div>
                    </div>
                    <div class="lightbox-controls">
                        <button class="lightbox-btn warning" onclick="weaponImageManager.editImageFromLightbox(${image.id}, '${(image.description || '').replace(/'/g, '\\\'')}')" title="编辑">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="lightbox-btn danger" onclick="weaponImageManager.deleteImageFromLightbox(${image.id})" title="删除">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 移除现有灯箱
        const existingLightbox = document.getElementById('weaponImageLightbox');
        if (existingLightbox) {
            existingLightbox.remove();
        }

        // 添加新灯箱
        document.body.insertAdjacentHTML('beforeend', lightboxHtml);
        
        // 显示灯箱
        const lightbox = document.getElementById('weaponImageLightbox');
        setTimeout(() => {
            lightbox.classList.add('show');
        }, 10);

        // 绑定键盘事件
        this.bindLightboxKeyEvents();
    }

    // 关闭灯箱
    closeLightbox() {
        const lightbox = document.getElementById('weaponImageLightbox');
        if (lightbox) {
            lightbox.classList.remove('show');
            setTimeout(() => {
                lightbox.remove();
                this.unbindLightboxKeyEvents();
            }, 300);
        }
    }

    // 处理灯箱图片加载错误
    handleLightboxImageError(img) {
        const loading = img.previousElementSibling;
        if (loading) {
            loading.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
                <span>图片加载失败</span>
            `;
        }
    }

    // 从灯箱编辑图片
    editImageFromLightbox(imageId, currentDescription) {
        this.closeLightbox();
        this.editImage(imageId, currentDescription);
    }

    // 从灯箱删除图片
    deleteImageFromLightbox(imageId) {
        this.deleteImage(imageId);
    }

    // 获取当前图片数据
    getCurrentImages() {
        const grid = document.getElementById('weaponImagesGrid');
        if (!grid || !this.currentWeaponId) return [];
        
        // 从DOM中获取当前显示的图片数据，或者从缓存中获取
        return this.cachedImages || [];
    }

    // 绑定灯箱键盘事件
    bindLightboxKeyEvents() {
        this.lightboxKeyHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeLightbox();
            }
        };
        document.addEventListener('keydown', this.lightboxKeyHandler);
        
        // 点击背景关闭
        const lightbox = document.getElementById('weaponImageLightbox');
        if (lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) {
                    this.closeLightbox();
                }
            });
        }
    }

    // 解绑灯箱键盘事件
    unbindLightboxKeyEvents() {
        if (this.lightboxKeyHandler) {
            document.removeEventListener('keydown', this.lightboxKeyHandler);
            this.lightboxKeyHandler = null;
        }
    }
}

// 创建全局实例
const weaponImageManager = new WeaponImageManager();

// 导出给其他脚本使用
window.weaponImageManager = weaponImageManager;