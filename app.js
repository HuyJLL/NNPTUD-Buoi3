const API_URL = 'https://api.escuelajs.co/api/v1/products';
let products = [];
let filteredProducts = [];
let currentPage = 1;
let pageSize = 10;
let sortCol = '';
let sortAsc = true;
let currentSelectedProduct = null;
let detailModal;
let formModal;

document.addEventListener('DOMContentLoaded', () => {
    detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
    formModal = new bootstrap.Modal(document.getElementById('formModal'));
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('pageSizeSelect').addEventListener('change', handlePageSizeChange);

    fetchData();
});

async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        products = data;
        filteredProducts = [...products];
        renderTable();
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Lỗi khi tải dữ liệu!');
    }
}

function getValidImageUrl(images) {
    try {
        let url = images[0];
        
        if (typeof url === 'string' && url.startsWith('[')) {
            let parsed = JSON.parse(url);
            url = parsed[0];
        }
        if (typeof url === 'string') {
            url = url.replace(/["[\]]/g, '');
        }
        if (url && url.includes('imgur.com')) {
            return 'https://placehold.co/50x50';
        }

        return url || 'https://placehold.co/50x50';
    } catch (e) {
        return 'https://placehold.co/50x50';
    }
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = filteredProducts.slice(startIndex, endIndex);

    paginatedItems.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'desc-tooltip';
        tr.title = item.description; 
        
        tr.innerHTML = `
            <td>${item.id}</td>
            <td><img src="${getValidImageUrl(item.images)}" class="product-img" alt="img" onerror="this.onerror=null; this.src='https://placehold.co/50x50';"></td>
            <td>${item.title}</td>
            <td>$${item.price}</td>
            <td>${item.category ? item.category.name : 'N/A'}</td>
        `;
        tr.onclick = () => viewDetail(item.id);
        tbody.appendChild(tr);
    });

    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i}, event)">${i}</a>`;
        pagination.appendChild(li);
    }
}

function changePage(page, event) {
    event.preventDefault();
    currentPage = page;
    renderTable();
}

function handlePageSizeChange(e) {
    pageSize = parseInt(e.target.value);
    currentPage = 1;
    renderTable();
}

function handleSearch(e) {
    const keyword = e.target.value.toLowerCase();
    filteredProducts = products.filter(p => p.title.toLowerCase().includes(keyword));
    currentPage = 1;
    renderTable();
}

function handleSort(col) {
    if (sortCol === col) {
        sortAsc = !sortAsc;
    } else {
        sortCol = col;
        sortAsc = true;
    }

    filteredProducts.sort((a, b) => {
        let valA = a[col];
        let valB = b[col];

        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
    });

    renderTable();
}

function viewDetail(id) {
    currentSelectedProduct = products.find(p => p.id === id);
    if (!currentSelectedProduct) return;

    document.getElementById('detailId').innerText = currentSelectedProduct.id;
    document.getElementById('detailTitle').innerText = currentSelectedProduct.title;
    document.getElementById('detailPrice').innerText = currentSelectedProduct.price;
    document.getElementById('detailCategory').innerText = currentSelectedProduct.category ? currentSelectedProduct.category.name : '';
    document.getElementById('detailDescription').innerText = currentSelectedProduct.description;
    document.getElementById('detailImage').src = getValidImageUrl(currentSelectedProduct.images);

    detailModal.show();
}

function openCreateModal() {
    document.getElementById('formModalTitle').innerText = 'Thêm Sản Phẩm Mới';
    document.getElementById('productForm').reset();
    document.getElementById('formId').value = '';
    formModal.show();
}

function openEditModal() {
    detailModal.hide();
    document.getElementById('formModalTitle').innerText = 'Cập nhật Sản Phẩm';
    
    document.getElementById('formId').value = currentSelectedProduct.id;
    document.getElementById('formTitle').value = currentSelectedProduct.title;
    document.getElementById('formPrice').value = currentSelectedProduct.price;
    document.getElementById('formDescription').value = currentSelectedProduct.description;
    document.getElementById('formCategoryId').value = currentSelectedProduct.category.id || 1;
    document.getElementById('formImage').value = getValidImageUrl(currentSelectedProduct.images);

    formModal.show();
}

async function saveProduct() {
    const id = document.getElementById('formId').value;
    const isEdit = id !== '';
    
    const payload = {
        title: document.getElementById('formTitle').value,
        price: parseInt(document.getElementById('formPrice').value),
        description: document.getElementById('formDescription').value,
        categoryId: parseInt(document.getElementById('formCategoryId').value),
        images: [document.getElementById('formImage').value]
    };

    const url = isEdit ? `${API_URL}/${id}` : API_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const savedItem = await response.json();

            if (isEdit) {
                const index = products.findIndex(p => p.id === parseInt(id));
                products[index] = savedItem;
            } else {
                products.unshift(savedItem);
            }
            
            document.getElementById('searchInput').dispatchEvent(new Event('input'));
            
            formModal.hide();
            alert(isEdit ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
        } else {
            alert('Lỗi từ Server!');
        }
    } catch (error) {
        console.error('Save error:', error);
        alert('Lỗi kết nối!');
    }
}

function exportCSV() {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentViewItems = filteredProducts.slice(startIndex, endIndex);

    if (currentViewItems.length === 0) {
        alert('Không có dữ liệu để export!');
        return;
    }
    let csvContent = "ID,Title,Price,Category\n";

    currentViewItems.forEach(item => {
        let safeTitle = `"${item.title.replace(/"/g, '""')}"`;
        let categoryName = item.category ? `"${item.category.name}"` : '""';
        csvContent += `${item.id},${safeTitle},${item.price},${categoryName}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "products_current_view.csv");
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}