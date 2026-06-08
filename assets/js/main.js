class KasirPro {
    constructor() {
        this.currentNumber = '0';
        this.firstValue = null;
        this.operator = null;
        this.total = 0;
        this.dataTransaksi = JSON.parse(localStorage.getItem('transaksi')) || [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTransaksi();
        this.preloader();
        this.animateElements();
    }

    preloader() {
        setTimeout(() => {
            document.getElementById('preloader').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('preloader').style.display = 'none';
            }, 500);
        }, 2000);
    }

    bindEvents() {
        // Calculator
        document.querySelectorAll('.calc-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleCalculator(e));
        });

        // Enter key untuk form
        document.getElementById('jumlahBarang').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.tambahBarang();
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    handleCalculator(e) {
        const value = e.target.dataset.value;
        const ripple = this.createRipple(e.target);

        if (!isNaN(value) || value === '.') {
            this.appendNumber(value);
        } else if (['+', '-', '*', '/'].includes(value)) {
            this.setOperator(value);
        } else if (value === '=') {
            this.calculate();
        } else if (value === 'CE') {
            this.clear();
        }

        e.target.appendChild(ripple);
    }

    createRipple(element) {
        const circle = document.createElement('span');
        const diameter = Math.max(element.clientWidth, element.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${-radius}px`;
        circle.style.top = `${-radius}px`;
        circle.classList.add('ripple');

        const ripple = element.getElementsByClassName('ripple')[0];
        if (ripple) ripple.remove();

        element.appendChild(circle);
        setTimeout(() => circle.remove(), 600);
        return circle;
    }

    appendNumber(num) {
        if (this.currentNumber === '0') {
            this.currentNumber = num;
        } else {
            this.currentNumber += num;
        }
        this.updateDisplay();
    }

    setOperator(op) {
        this.firstValue = parseFloat(this.currentNumber);
        this.operator = op;
        this.currentNumber = '0';
    }

    calculate() {
        const secondValue = parseFloat(this.currentNumber);
        switch (this.operator) {
            case '+': this.currentNumber = this.firstValue + secondValue; break;
            case '-': this.currentNumber = this.firstValue - secondValue; break;
            case '*': this.currentNumber = this.firstValue * secondValue; break;
            case '/': 
                if (secondValue === 0) {
                    this.showNotification('Tidak bisa dibagi nol!', 'error');
                    return;
                }
                this.currentNumber = this.firstValue / secondValue; 
                break;
        }
        this.updateDisplay();
        this.firstValue = null;
        this.operator = null;
    }

    clear() {
        this.currentNumber = '0';
        this.firstValue = null;
        this.operator = null;
        this.updateDisplay();
    }

    updateDisplay() {
        document.getElementById('displaynumber').textContent = this.currentNumber;
    }

    // Kasir Functions
    async tambahBarang() {
        const nama = document.getElementById('namaBarang').value.trim();
        const harga = parseInt(document.getElementById('hargaBarang').value);
        const jumlah = parseInt(document.getElementById('jumlahBarang').value);

        if (!nama || !harga || !jumlah) {
            this.showNotification('Lengkapi semua field!', 'error');
            return;
        }

        const totalItem = harga * jumlah;
        this.total += totalItem;

        const item = { id: Date.now(), nama, harga, jumlah, totalItem, timestamp: new Date().toISOString() };
        this.dataTransaksi.push(item);

        this.renderTable();
        this.updateTotal();
        this.saveData();
        this.resetForm();

        this.showNotification(`Berhasil menambah ${nama}`, 'success');
    }

    hapusBarang(id, totalItem) {
        this.dataTransaksi = this.dataTransaksi.filter(item => item.id !== id);
        this.total -= totalItem;
        this.renderTable();
        this.updateTotal();
        this.saveData();
        this.showNotification('Barang dihapus!', 'warning');
    }

    renderTable() {
        const tbody = document.getElementById('listBarang');
        tbody.innerHTML = '';

        this.dataTransaksi.forEach(item => {
            const row = tbody.insertRow();
            row.classList.add('table-row');
            row.innerHTML = `
                <td>${item.nama}</td>
                <td>Rp ${this.formatRupiah(item.harga)}</td>
                <td>${item.jumlah}</td>
                <td>Rp ${this.formatRupiah(item.totalItem)}</td>
                <td>
                    <button class="btn-delete" onclick="kasir.hapusBarang(${item.id}, ${item.totalItem})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        });
    }

    hitungDiskon() {
        const diskon = parseInt(document.getElementById('diskon').value);
        if (!diskon || diskon > 100) {
            this.showNotification('Diskon tidak valid (0-100%)', 'error');
            return;
        }

        const potongan = this.total * (diskon / 100);
        const totalAkhir = this.total - potongan;
        document.getElementById('totalAkhir').textContent = `Rp ${this.formatRupiah(totalAkhir)}`;
        this.showNotification(`Diskon ${diskon}% diterapkan`, 'success');
    }

    hitungKembalian() {
        const bayar = parseInt(document.getElementById('bayar').value);
        const totalAkhirText = document.getElementById('totalAkhir').textContent;
        
        if (!bayar) {
            this.showNotification('Masukkan jumlah pembayaran!', 'error');
            return;
        }

        let totalDipakai = this.total;
        if (totalAkhirText !== 'Rp 0') {
            totalDipakai = parseInt(totalAkhirText.replace(/Rp |,/g, '').replace(/\./g, ''));
        }

        const kembalian = bayar - totalDipakai;
        document.getElementById('kembalian').textContent = `Rp ${this.formatRupiah(kembalian)}`;

        if (kembalian < 0) {
            this.showNotification('Uang kurang!', 'error');
        } else {
            this.showNotification('Pembayaran berhasil!', 'success');
        }
    }

    cetakStruk() {
        const printWindow = window.open('', '_blank');
        const totalText = document.getElementById('totalBelanja').textContent;
        const tbody = document.getElementById('listBarang').innerHTML;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Struk Pembelian</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                        .header { text-align: center; margin-bottom: 30px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                        .total { font-size: 1.5em; font-weight: bold; text-align: right; margin-top: 20px; }
                        .footer { margin-top: 30px; text-align: center; font-size: 0.8em; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>Kasir Pro</h2>
                        <p>${new Date().toLocaleString('id-ID')}</p>
                    </div>
                    <table>
                        ${tbody}
                    </table>
                    <div class="total">Total: ${totalText}</div>
                    <div class="footer">
                        Terima kasih telah berbelanja<br>
                        Cetak: ${new Date().toLocaleString('id-ID')}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    async simpanTransaksi() {
        try {
            const response = await fetch('backend/php/transaksi.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transaksi: this.dataTransaksi, total: this.total })
            });

            if (response.ok) {
                this.showNotification('Transaksi tersimpan ke server!', 'success');
                this.clearTransaksi();
            }
        } catch (error) {
            this.showNotification('Gagal menyimpan, menggunakan local storage', 'warning');
        }
    }

    formatRupiah(angka) {
        return new Intl.NumberFormat('id-ID').format(angka);
    }

    updateTotal() {
        document.getElementById('totalBelanja').textContent = `Rp ${this.formatRupiah(this.total)}`;
        document.getElementById('totalAkhir').textContent = `Rp ${this.formatRupiah(this.total)}`;
    }

    resetForm() {
        document.getElementById('namaBarang').value = '';
        document.getElementById('hargaBarang').value = '';
        document.getElementById('jumlahBarang').value = '';
        document.getElementById('diskon').value = '';
        document.getElementById('bayar').value = '';
        document.getElementById('kembalian').textContent = 'Rp 0';
    }

    saveData() {
        localStorage.setItem('transaksi', JSON.stringify(this.dataTransaksi));
    }

    loadTransaksi() {
        this.dataTransaksi = JSON.parse(localStorage.getItem('transaksi')) || [];
        this.total = this.dataTransaksi.reduce((sum, item) => sum + item.totalItem, 0);
        this.renderTable();
        this.updateTotal();
    }

    clearTransaksi() {
        this.dataTransaksi = [];
        this.total = 0;
        this.renderTable();
        this.updateTotal();
        this.saveData();
    }

    lihatLaporan() {
        const totalSemua = this.dataTransaksi.reduce((sum, item) => sum + item.totalItem, 0);
        const modal = this.createModal(`
            <h3>Laporan Transaksi</h3>
            <div style="max-height: 300px; overflow-y: auto; margin: 20px 0;">
                ${this.dataTransaksi.map(item => 
                    `<div>${item.nama} x${item.jumlah} = Rp ${this.formatRupiah(item.totalItem)}</div>`
                ).join('')}
            </div>
            <div style="font-size: 1.5em; font-weight: bold; text-align: right;">
                Total: Rp ${this.formatRupiah(totalSemua)}
            </div>
        `);
        document.body.appendChild(modal);
    }

    createModal(content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <button class="modal-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
                ${content}
            </div>
        `;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        return modal;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    handleKeyboard(e) {
        if (document.getElementById('loginPage').style.display !== 'none') return;

        if (['0','1','2','3','4','5','6','7','8','9'].includes(e.key)) {
            this.appendNumber(e.key);
        } else if (e.key === 'Enter') {
            if (document.activeElement.id === 'bayar') {
                this.hitungKembalian();
            }
        } else if (['+','-','*','/'].includes(e.key)) {
            this.setOperator(e.key);
        } else if (e.key === 'Escape') {
            this.clear();
        }
    }

    animateElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        });

        document.querySelectorAll('.glassmorphism, .summary-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease';
            observer.observe(el);
        });
    }
}

// Login System
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const card = document.querySelector('.login-card');
    const success = document.getElementById('successCheck');
    const error = document.getElementById('errorCross');
    const loading = document.getElementById('loadingSpinner');

    const successSound = document.getElementById('successSound');
    const errorSound = document.getElementById('errorSound');

    // Reset
    success.style.display = 'none';
    error.style.display = 'none';
    loading.style.display = 'flex';

    setTimeout(async () => {
        try {
            const response = await fetch('backend/php/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                loading.style.display = 'none';
                success.style.display = 'flex';

                // Putar suara berhasil
                successSound.currentTime = 0;
                successSound.play();
                
                setTimeout(() => {
                    document.getElementById('loginPage').style.display = 'none';
                    document.getElementById('app').style.display = 'block';
                    window.kasir = new KasirPro();
                    localStorage.setItem('login', 'true');
                }, 1000);
            } else {
                loading.style.display = 'none';
                error.style.display = 'flex';
                
                // Putar suara gagal
                errorSound.currentTime = 0;
                errorSound.play();
                setTimeout(() => error.style.display = 'none', 2000);
            }
        } catch (err) {
            // Fallback local login
            if (username === 'admin' && password === '123') {
                loading.style.display = 'none';
                success.style.display = 'flex';

                successSound.currentTime = 0;
                successSound.play();
                setTimeout(() => {
                    document.getElementById('loginPage').style.display = 'none';
                    document.getElementById('app').style.display = 'block';
                    window.kasir = new KasirPro();
                    localStorage.setItem('login', 'true');
                }, 1000);
            } else {
                loading.style.display = 'none';
                error.style.display = 'flex';
                
                errorSound.currentTime = 0;
                errorSound.play();
                setTimeout(() => error.style.display = 'none', 2000);
            }
        }
    }, 1000);
}

function logout() {
    localStorage.removeItem('login');
    localStorage.removeItem('transaksi');
    location.reload();
}

// Auto login check
if (localStorage.getItem('login') === 'true') {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    window.kasir = new KasirPro();
}

// Global functions for onclick
window.tambahBarang = () => kasir.tambahBarang();
window.hitungDiskon = () => kasir.hitungDiskon();
window.hitungKembalian = () => kasir.hitungKembalian();
window.cetakStruk = () => kasir.cetakStruk();
window.lihatLaporan = () => kasir.lihatLaporan();
window.login = login;
window.logout = logout;

// Jalankan preloader saat halaman dibuka
window.addEventListener('load', () => {
    setTimeout(() => {
        const preloader = document.getElementById('preloader');

        if (preloader) {
            preloader.style.opacity = '0';

            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }
    }, 1500);
});