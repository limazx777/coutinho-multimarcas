// --- Data ---

let products = { clothing: [], vape: [] };

// Esta função organiza os dados vindos do Firebase e atualiza a tela
function renderizarProdutosNoSite(listaProdutos) {
    const updatedProducts = { clothing: [], vape: [] };

    listaProdutos.forEach((p) => {
        // Garante que o preço seja um número para evitar erros de cálculo e formatação no carrinho
        p.price = typeof p.price === 'number' ? p.price : parseFloat(p.price || 0);

        // Normaliza a categoria para evitar erros de digitação (maiúsculas/minúsculas)
        const cat = p.category ? p.category.toLowerCase() : "";
        if (cat === "clothing" || cat === "roupas") {
            updatedProducts.clothing.push(p);
        } else if (cat === "vape" || cat === "pods") {
            updatedProducts.vape.push(p);
        }
    });

    products = updatedProducts;
    renderProducts();
}

// Torna a função visível para o script type="module" do HTML
window.renderizarProdutosNoSite = renderizarProdutosNoSite;

const clothingColors = ["Preto", "Branco", "Azul Marinho", "Cinza"];

let cart = JSON.parse(localStorage.getItem('coutinho_cart')) || [];
let isAgeVerified = localStorage.getItem('coutinho_age_verified') === 'true';

// --- Functions ---

function toggleMenu() {
    const nav = document.querySelector('nav');
    const navMenu = document.getElementById('nav-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    const icon = menuToggle.querySelector('i');
    
    nav.classList.toggle('menu-open');
    navMenu.classList.toggle('mobile-active');
    menuToggle.classList.toggle('active');
    
    if (icon.classList.contains('fa-bars')) {
        icon.classList.replace('fa-bars', 'fa-times');
    } else {
        icon.classList.replace('fa-times', 'fa-bars');
    }

    // Bloqueia o scroll do corpo quando o menu está aberto
    document.body.style.overflow = navMenu.classList.contains('mobile-active') ? 'hidden' : '';
}

function showSection(sectionId) {
    // Fechar menu mobile ao clicar em um link
    const nav = document.querySelector('nav');
    if(nav) nav.classList.remove('menu-open');
    
    document.getElementById('nav-menu').classList.remove('mobile-active');
    const menuToggle = document.querySelector('.menu-toggle');
    if(menuToggle) menuToggle.classList.remove('active');
    
    const menuIcon = document.querySelector('.menu-toggle i');
    if(menuIcon) {
        menuIcon.classList.add('fa-bars');
        menuIcon.classList.remove('fa-times');
    }
    document.body.style.overflow = ''; // Destrava o scroll

    if (sectionId === 'vape' && !isAgeVerified) {
        document.getElementById('age-gate').style.display = 'flex';
        return;
    }

    // Update Active Links
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
    const activeLink = document.getElementById(`link-${sectionId}`);
    if(activeLink) activeLink.classList.add('active');

    // Switch Sections
    document.querySelectorAll('section').forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    window.scrollTo(0, 0);
}

function selectOption(productId, type, element) {
    // Remove a classe 'selected' de todos os botões do mesmo grupo
    const parent = element.parentElement;
    parent.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
    // Adiciona ao botão clicado
    element.classList.add('selected');

    // Se for uma seleção de cor, atualiza a disponibilidade dos tamanhos
    if (type === 'color') {
        updateSizeAvailability(productId);
    }
}

function updateSizeAvailability(productId) {
    const product = products.clothing.find(p => p.id === productId);
    if (!product || !product.stock) return;

    const hasColors = typeof product.stock === 'object';
    const selectedColor = document.querySelector(`#color-group-${productId} .option-btn.selected`)?.getAttribute('data-value');
    
    // Se o produto tiver cores, busca o estoque da cor, senão usa o estoque numérico direto
    const colorStock = hasColors ? (selectedColor ? (product.stock[selectedColor] || {}) : null) : null;

    const sizeButtons = document.querySelectorAll(`#size-group-${productId} .option-btn`);
    sizeButtons.forEach(btn => {
        const sizeValue = btn.getAttribute('data-value');
        let qty = 0;
        let isAvailable = false;

        if (hasColors) {
            qty = colorStock ? (colorStock[sizeValue] || 0) : 0;
            isAvailable = !!selectedColor && qty > 0;
        } else {
            qty = product.stock;
            isAvailable = qty > 0;
        }
        
        btn.disabled = !isAvailable;
        btn.innerText = (hasColors && !selectedColor) ? sizeValue : `${sizeValue} (${qty})`;

        // Se o tamanho que estava selecionado agora está indisponível, removemos a seleção
        if (!isAvailable) btn.classList.remove('selected');
    });
}

function renderProducts() {
    const clothingGrid = document.getElementById('clothing-grid');
    const vapeGrid = document.getElementById('vape-grid');

    if (clothingGrid) {
        clothingGrid.innerHTML = ""; // Limpa antes de renderizar
        products.clothing.forEach(p => {
            clothingGrid.innerHTML += createProductCard(p);
        });
    }

    if (vapeGrid) {
        vapeGrid.innerHTML = ""; // Limpa antes de renderizar
        products.vape.forEach(p => {
            vapeGrid.innerHTML += createProductCard(p);
        });
    }
}

function createProductCard(product) {
    let optionsHtml = '';
    const hasColors = product.sizes && typeof product.stock === 'object';

    // Se o produto tiver tamanhos definidos, exibe os seletores de cor e tamanho
    if (product.sizes) {
        const colorGroupHtml = hasColors ? `
            <div class="option-label">Cor</div>
            <div class="option-group" id="color-group-${product.id}">
                ${clothingColors.map(c => `
                    <button class="option-btn" data-value="${c}" onclick="selectOption('${product.id}', 'color', this)">${c}</button>
                `).join('')}
            </div>
        ` : '';

        optionsHtml = `
            <div class="product-options">
                ${colorGroupHtml}
                <div class="option-label">Tamanho</div>
                <div class="option-group" id="size-group-${product.id}">
                    ${product.sizes.map(s => `
                        <button class="option-btn" data-value="${s}" ${hasColors ? 'disabled' : ''} onclick="selectOption('${product.id}', 'size', this)">
                            ${hasColors ? s : `${s} (${product.stock})`}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    let priceAddon = "";
    // Define estado do botão para produtos sem variantes (Vapes)
    let btnText = "Adicionar ao Carrinho";
    let btnDisabled = "";
    
    if (!product.sizes && product.stock === 0) {
        btnText = "Esgotado";
        btnDisabled = "disabled";
    } else if (!product.sizes) {
        priceAddon = ` <span style="font-size: 0.8rem; color: var(--text-dim);">(${product.stock} un.)</span>`;
    }

    // Suporte para Imagem ou Ícone
    const displayImg = product.image 
        ? `<img src="${product.image}" alt="${product.name}" style="width:100%; height:100%; object-fit:cover;">`
        : product.icon;

    // Garante que o preço seja um número para não quebrar o toFixed
    const priceValue = typeof product.price === 'number' 
        ? product.price 
        : parseFloat(product.price || 0);

    return `
        <div class="product-card">
            <div class="product-img">${displayImg}</div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <span class="product-price">R$ ${priceValue.toFixed(2)}${priceAddon}</span>
                ${optionsHtml}
                <button class="add-to-cart" ${btnDisabled} onclick="addToCart('${product.id}')">
                    ${btnText}
                </button>
            </div>
        </div>
    `;
}

function confirmAge() {
    isAgeVerified = true;
    localStorage.setItem('coutinho_age_verified', 'true');
    document.getElementById('age-gate').style.display = 'none';
    renderProducts();
}

function goHome() {
    window.location.href = 'index.html';
}

function toggleCart() {
    document.getElementById('cart-modal').classList.toggle('open');
}

function addToCart(id) {
    const product = [...products.clothing, ...products.vape].find(p => p.id === id);
    if (!product) return;

    let selectedColor = null;
    let selectedSize = null;

    // Validação de opções para roupas
    if (product.sizes) {
        const hasColors = typeof product.stock === 'object';
        const selectedColorBtn = document.querySelector(`#color-group-${id} .option-btn.selected`);
        const selectedSizeBtn = document.querySelector(`#size-group-${id} .option-btn.selected`);

        if ((hasColors && !selectedColorBtn) || !selectedSizeBtn) {
            alert("Por favor, selecione as opções disponíveis antes de adicionar.");
            return;
        }

        if (hasColors) {
            selectedColor = selectedColorBtn.getAttribute('data-value');
            selectedSize = selectedSizeBtn.getAttribute('data-value');
            if (product.stock[selectedColor][selectedSize] <= 0) {
                alert("Desculpe, esta combinação acabou de esgotar!");
                updateSizeAvailability(id);
                return;
            }
            product.stock[selectedColor][selectedSize]--;
        } else {
            selectedSize = selectedSizeBtn.getAttribute('data-value');
            if (product.stock <= 0) {
                alert("Desculpe, este produto esgotou!");
                updateSizeAvailability(id);
                return;
            }
            product.stock--;
        }
        updateSizeAvailability(id);
    } else {
        // Validação final de estoque para Vapes
        if (product.stock <= 0) {
            alert("Desculpe, este produto esgotou!");
            renderProducts();
            return;
        }
        
        // Baixa no estoque
        product.stock--;
        renderProducts(); // Atualiza vitrine para mostrar nova quantidade ou estado esgotado
    }

    // Verifica se o item (com a mesma cor e tamanho) já está no carrinho
    const existingItem = cart.find(item => 
        item.id === id && 
        item.selectedColor === selectedColor && 
        item.selectedSize === selectedSize
    );

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({ ...product, selectedColor, selectedSize, quantity: 1 });
    }

    localStorage.setItem('coutinho_cart', JSON.stringify(cart));
    updateCart();

    const btn = event.currentTarget || event.target;
    const originalText = btn.innerText;
    btn.innerText = "Adicionado! ✓";
    setTimeout(() => {
        btn.innerText = originalText;
    }, 1000);
}

function removeFromCart(index) {
    const item = cart[index];
    // Recupera o produto original para devolver ao estoque
    const originalProduct = [...products.clothing, ...products.vape].find(p => p.id === item.id);
    
    if (originalProduct) {
        const hasColors = typeof originalProduct.stock === 'object';
        if (hasColors && item.selectedColor && item.selectedSize) {
            // Devolve estoque de roupa
            originalProduct.stock[item.selectedColor][item.selectedSize] += (item.quantity || 1);
            updateSizeAvailability(item.id);
        } else if (!hasColors && item.selectedSize) {
            // Devolve estoque de roupa sem cores (Bonés)
            originalProduct.stock += (item.quantity || 1);
            updateSizeAvailability(item.id);
        } else if (originalProduct.stock !== undefined) {
            // Devolve estoque de vape/outros
            originalProduct.stock += (item.quantity || 1);
            renderProducts();
        }
    }

    // Remove o item do array pelo índice
    cart.splice(index, 1);
    // Atualiza o localStorage com o novo array
    localStorage.setItem('coutinho_cart', JSON.stringify(cart));
    // Re-renderiza o carrinho
    updateCart();
}

function changeQuantity(index, delta) {
    const item = cart[index];
    const product = [...products.clothing, ...products.vape].find(p => p.id === item.id);
    if (!product) return;

    const hasColors = typeof product.stock === 'object';

    if (delta === 1) {
        // Lógica de Incremento (Adicionar)
        if (hasColors && item.selectedColor && item.selectedSize) {
            if (product.stock[item.selectedColor][item.selectedSize] <= 0) return alert("Estoque insuficiente!");
            product.stock[item.selectedColor][item.selectedSize]--;
        } else {
            if (product.stock <= 0) return alert("Estoque insuficiente!");
            product.stock--;
        }
        item.quantity = (item.quantity || 1) + 1;
    } else {
        // Lógica de Decremento (Remover)
        if (item.quantity > 1) {
            if (hasColors && item.selectedColor && item.selectedSize) {
                product.stock[item.selectedColor][item.selectedSize]++;
            } else {
                product.stock++;
            }
            item.quantity--;
        } else {
            // Se for 1 e diminuir, remove o item completamente
            removeFromCart(index);
            return;
        }
    }

    localStorage.setItem('coutinho_cart', JSON.stringify(cart));
    updateCart();
    renderProducts();
    if (product.sizes) updateSizeAvailability(item.id);
}

function updateCart() {
    const count = document.getElementById('cart-count');
    const list = document.getElementById('cart-items-list');
    const totalDisplay = document.getElementById('cart-total');
    
    // Soma a quantidade total de todos os itens para o badge
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (count) count.innerText = totalItems;
    if (!list || !totalDisplay) return;

    list.innerHTML = "";

    if (cart.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: var(--text-dim);">
                <i class="fas fa-shopping-basket" style="font-size: 3rem; margin-bottom: 1rem; display: block; opacity: 0.3;"></i>
                <p style="font-weight: 500;">Seu carrinho está vazio</p>
                <button class="btn btn-outline" style="margin-top: 1.5rem; width: 100%; font-size: 0.9rem;" onclick="toggleCart()">
                    Voltar às compras
                </button>
            </div>
        `;
        totalDisplay.innerText = "R$ 0.00";
        return;
    }

    let total = 0;
    cart.forEach((item, index) => {
        // Tratamento de segurança caso existam itens antigos no localStorage com preço em string
        const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price || 0);
        const itemQty = item.quantity || 1;
        total += itemPrice * itemQty;

        const optionsDesc = item.selectedColor ? 
            `<span style="font-size: 0.75rem; color: var(--text-dim);">Cor: ${item.selectedColor} | Tam: ${item.selectedSize}</span>` : '';

        list.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-info" style="flex-grow: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <span style="font-weight: 600;">${item.name}</span>
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="changeQuantity(${index}, -1)">-</button>
                            <span class="qty-val">${itemQty}</span>
                            <button class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button>
                        </div>
                    </div>
                    ${optionsDesc}
                    <span style="font-size: 0.85rem; color: var(--text-dim);">R$ ${(itemPrice * itemQty).toFixed(2)}</span>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${index})" title="Remover item">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    });

    totalDisplay.innerText = `R$ ${total.toFixed(2)}`;
}

function simulatedCheckout() {
    if (cart.length === 0) return alert("Seu carrinho está vazio!");
    toggleCart(); // Fecha o carrinho lateral
    document.getElementById('checkout-modal').style.display = 'flex';
}

function closeCheckout() {
    document.getElementById('checkout-modal').style.display = 'none';
}

function toggleDeliveryFields() {
    const type = document.getElementById('delivery-type').value;
    const addressFields = document.getElementById('address-fields');
    const inputs = addressFields.querySelectorAll('input:not(#address-complement)');
    
    if (type === 'pickup') {
        addressFields.style.display = 'none';
        inputs.forEach(i => i.required = false);
    } else {
        addressFields.style.display = 'block';
        inputs.forEach(i => i.required = true);
    }
}

function toggleChangeField() {
    const method = document.getElementById('payment-method').value;
    const changeField = document.getElementById('change-field');
    const changeInput = document.getElementById('cash-change');
    
    if (method === 'dinheiro') {
        changeField.style.display = 'block';
        changeInput.required = true;
    } else {
        changeField.style.display = 'none';
        changeInput.required = false;
    }
}

function sendWhatsAppOrder(event) {
    event.preventDefault();
    
    const name = document.getElementById('client-name').value;
    const type = document.getElementById('delivery-type').value;
    const payment = document.getElementById('payment-method').value;
    const change = document.getElementById('cash-change').value;
    
    const phoneNumber = "551199984783952"; // Substitua pelo seu número real
    let message = "🛍️ *Novo Pedido - Coutinho | Multimarcas & Pods*\n\n";
    message += `👤 *Cliente:* ${name}\n`;
    message += `🚚 *Tipo:* ${type === 'delivery' ? 'Entrega' : 'Retirada no Local'}\n`;
    
    if (type === 'delivery') {
        const street = document.getElementById('address-street').value;
        const num = document.getElementById('address-number').value;
        const neighborhood = document.getElementById('address-neighborhood').value;
        const complement = document.getElementById('address-complement').value;
        message += `📍 *Endereço:* ${street}, ${num}\n`;
        message += `🏘️ *Bairro:* ${neighborhood}\n`;
        if (complement) message += `ℹ️ *Complemento:* ${complement}\n`;
    }

    message += `💳 *Pagamento:* ${payment.toUpperCase()}`;
    if (payment === 'dinheiro' && change) message += ` (Troco para R$ ${change})`;
    message += "\n\n--- *ITENS DO PEDIDO* ---\n";

    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const optionsText = item.selectedColor ? ` (${item.selectedColor}, ${item.selectedSize})` : '';
        message += `• *${item.quantity}x ${item.name}${optionsText}* - R$ ${itemTotal.toFixed(2)}\n`;
        total += itemTotal;
    });

    message += `\n💰 *Total: R$ ${total.toFixed(2)}*`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    // --- Limpeza Automática do Carrinho ---
    cart = []; // Esvazia a lista de itens na memória
    localStorage.removeItem('coutinho_cart'); // Remove os itens salvos no navegador
    updateCart(); // Atualiza o contador e a lista visual do carrinho
    
    // Retorna para a home ou recarrega para limpar o estado
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        showSection('home');
    } else {
        window.location.href = 'index.html';
    }
}

function handleParallax() {
    const scrolled = window.scrollY;
    const homeSection = document.getElementById('home');
    if (homeSection) {
        // O fator 0.2 define a velocidade do parallax (menor = mais lento)
        homeSection.style.setProperty('--parallax-y', (scrolled * 0.02) + 'px');
    }
}

// Init
window.onload = () => {
    updateCart(); // Atualiza o carrinho primeiro para garantir persistência
    window.addEventListener('scroll', handleParallax);
};