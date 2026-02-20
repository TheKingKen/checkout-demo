// Currency conversion utility
// Base currency is HKD (Hong Kong Dollar)

// Global currency state
let currentCurrency = sessionStorage.getItem('selectedCurrency') || localStorage.getItem('selectedCurrency') || 'HKD';
let fxRates = {};
const TRANSLATION_STORAGE_KEY = 'translationMap';

const DEFAULT_TRANSLATIONS = {
    en: {
        'all-products': {
            breadcrumbAllProducts: 'All Products',
            categoryTitle: 'Shop by Category',
            loginButton: 'LOGIN',
            logoutButton: 'LOGOUT',
            categoryPhoneCaseTitle: 'Clean Phone Case',
            categoryPhoneCaseDesc: 'Premium protective phone cases in various colors and styles',
            categoryGiftTitle: 'Gift Cards',
            categoryGiftDesc: 'Perfect gifts for any occasion. Choose amount and send digitally'
        },
        'phone-case-catalog': {
            loginButton: 'LOGIN',
            logoutButton: 'LOGOUT',
            cartButton: 'CART',
            breadcrumbAllProducts: 'All Products',
            breadcrumbCategory: 'Clean Phone Case',
            categoryTitle: 'Clean Phone Case',
            addButton: 'Add',
            addedButton: 'Added!',
            shoppingCartTitle: 'Shopping Cart',
            emptyCart: 'Your cart is empty',
            proceedCheckout: 'Proceed to Checkout',
            removeButton: 'Remove',
            totalLabel: 'Total',
            eachLabel: 'each',
            loginTitle: 'Login',
            usernameLabel: 'Username',
            passwordLabel: 'Password',
            loginSubmit: 'Login',
            alertLoggedOut: 'Logged out successfully',
            alertLoginSuccess: 'Login successful!',
            alertCartEmpty: 'Your cart is empty',
            phoneCasePrefix: 'Phone Case',
            giftCardName: 'Gift Card',
            designLabel: 'Design',
            recipientLabel: 'Recipient',
            senderLabel: 'Sender',
            designRed: 'Red',
            designBlue: 'Blue',
            designGreen: 'Green',
            designPurple: 'Purple',
            productBlack: 'Black',
            productWhite: 'White',
            productRed: 'Red',
            productBlue: 'Blue',
            productGreen: 'Green',
            productYellow: 'Yellow',
            productPurple: 'Purple',
            productPink: 'Pink',
            productOrange: 'Orange',
            productTeal: 'Teal',
            productBrown: 'Brown',
            productGray: 'Gray',
            descBlack: 'Sleek and timeless protection with minimalist style',
            descWhite: 'Clean and bright design for a fresh look',
            descRed: 'Bold and vibrant protection that stands out',
            descBlue: 'Cool and professional shade for everyday use',
            descGreen: 'Natural and soothing color for eco-conscious users',
            descYellow: 'Bright and cheerful protection to brighten your day',
            descPurple: 'Elegant and sophisticated protection with luxury appeal',
            descPink: 'Soft and trendy option for fashion-forward users',
            descOrange: 'Warm and energetic protection for adventurers',
            descTeal: 'Refreshing and modern color for contemporary style',
            descBrown: 'Warm and earthy tone for timeless elegance',
            descGray: 'Neutral and versatile protection for any occasion'
        },
        'gift-cards': {
            loginButton: 'LOGIN',
            logoutButton: 'LOGOUT',
            cartButton: 'CART',
            breadcrumbAllProducts: 'All Products',
            breadcrumbCurrent: 'Gift Cards',
            categoryTitle: 'Gift Cards',
            categoryDesc: 'Perfect digital gift for any occasion. Instantly delivered via email with no shipping fees. Choose your design and amount, then let them pick what they love. Never expires and can be used online anytime.',
            previewTitle: 'Preview',
            chooseDesignTitle: 'Choose Design',
            selectAmountTitle: 'Select Amount',
            recipientInfoTitle: 'Recipient Information',
            senderInfoTitle: 'Your Information',
            messageTitle: 'Message (Optional)',
            addToCartButton: 'Add to Cart',
            expressCheckoutButton: 'Express Checkout',
            expressBack: 'Back to Gift Card Form',
            expressLoading: 'Loading payment form...',
            expressOrderSummary: 'Order Summary',
            expressQuantity: 'Quantity',
            expressRecipientEmail: 'Recipient Email',
            expressSenderEmail: 'Your Email',
            expressMessage: 'Message',
            expressTotal: 'Total',
            expressProcessing: 'Processing...',
            designRed: 'Red',
            designBlue: 'Blue',
            designGreen: 'Green',
            designPurple: 'Purple',
            recipientNameLabel: 'Recipient Name',
            recipientEmailLabel: 'Recipient Email',
            senderNameLabel: 'Your Name',
            senderEmailLabel: 'Your Email',
            messageLabel: 'Personal Message',
            previewText: 'GIFT CARD',
            shoppingCartTitle: 'Shopping Cart',
            emptyCart: 'Your cart is empty',
            proceedCheckout: 'Proceed to Checkout',
            loginTitle: 'Login',
            usernameLabel: 'Username',
            passwordLabel: 'Password',
            loginSubmit: 'Login',
            alertLoggedOut: 'Logged out successfully',
            alertLoginSuccess: 'Login successful!',
            alertCartEmpty: 'Your cart is empty',
            giftCardName: 'Gift Card',
            giftCardAddedPrefix: 'Gift Card (',
            giftCardAddedSuffix: ') added to cart!',
            designLabel: 'Design',
            recipientLabel: 'Recipient',
            senderLabel: 'Sender',
            totalLabel: 'Total',
            eachLabel: 'each',
            removeButton: 'Remove'
        },
        checkout: {
            shopName: 'iPhone Case Shop',
            breadcrumbCart: 'Cart',
            breadcrumbShipping: 'Shipping',
            breadcrumbCheckout: 'Checkout',
            shippingAddressTitle: 'Shipping Address',
            shippingCarrierTitle: 'Shipping Carrier',
            paymentTitle: 'Payment',
            chooseCarrierButton: 'Choose a Shipping Carrier',
            continueCheckout: 'Continue Checkout',
            changeButton: 'Change',
            payButton: 'Pay',
            orderSummaryTitle: 'Order Summary',
            subtotalLabel: 'Subtotal',
            shippingLabel: 'Shipping',
            totalLabel: 'Total',
            quantityLabel: 'Quantity',
            designLabel: 'Design',
            recipientLabel: 'Recipient',
            fromLabel: 'From',
            freeLabel: 'Free',
            regularCarrier: 'Regular Carrier',
            expressCarrier: 'Express Carrier',
            firstNameLabel: 'First Name',
            lastNameLabel: 'Last Name',
            address1Label: 'Address Line 1',
            address2Label: 'Address Line 2',
            regionLabel: 'Region',
            countryLabel: 'Country',
            cardNumberLabel: 'Card Number',
            cardholderLabel: 'Cardholder Name',
            expiryLabel: 'Expiry Date (MM/YY)',
            cvvLabel: 'CVV',
            digitalTitle: 'Digital Gift Card',
            digitalBody: 'This is a digital gift card. No shipping address is required. You will receive a delivery confirmation via email.'
        }
    },
    zh: {
        'all-products': {
            breadcrumbAllProducts: '全部商品',
            categoryTitle: '按类别选购',
            loginButton: '登录',
            logoutButton: '退出',
            categoryPhoneCaseTitle: '简约手机壳',
            categoryPhoneCaseDesc: '多色多款高品质保护手机壳',
            categoryGiftTitle: '礼品卡',
            categoryGiftDesc: '适合任何场合的礼物。选择金额并数字发送'
        },
        'phone-case-catalog': {
            loginButton: '登录',
            logoutButton: '退出',
            cartButton: '购物车',
            breadcrumbAllProducts: '全部商品',
            breadcrumbCategory: '简约手机壳',
            categoryTitle: '简约手机壳',
            addButton: '添加',
            addedButton: '已添加',
            shoppingCartTitle: '购物车',
            emptyCart: '购物车为空',
            proceedCheckout: '去结账',
            removeButton: '删除',
            totalLabel: '合计',
            eachLabel: '每件',
            loginTitle: '登录',
            usernameLabel: '用户名',
            passwordLabel: '密码',
            loginSubmit: '登录',
            alertLoggedOut: '已退出登录',
            alertLoginSuccess: '登录成功！',
            alertCartEmpty: '购物车为空',
            phoneCasePrefix: '手机壳',
            giftCardName: '礼品卡',
            designLabel: '设计',
            recipientLabel: '收礼人',
            senderLabel: '送礼人',
            designRed: '红色',
            designBlue: '蓝色',
            designGreen: '绿色',
            designPurple: '紫色',
            productBlack: '黑色',
            productWhite: '白色',
            productRed: '红色',
            productBlue: '蓝色',
            productGreen: '绿色',
            productYellow: '黄色',
            productPurple: '紫色',
            productPink: '粉色',
            productOrange: '橙色',
            productTeal: '蓝绿色',
            productBrown: '棕色',
            productGray: '灰色',
            descBlack: '极简风格的经典保护',
            descWhite: '清爽明亮，带来清新感',
            descRed: '醒目亮眼，保护更出众',
            descBlue: '冷静专业，适合日常使用',
            descGreen: '自然舒缓，适合环保主义者',
            descYellow: '明亮欢快，让一天更有活力',
            descPurple: '优雅高级，尽显质感',
            descPink: '柔和时尚，走在潮流前沿',
            descOrange: '温暖有活力，适合爱冒险的你',
            descTeal: '清新现代，符合当代风格',
            descBrown: '温暖大地色，经典耐看',
            descGray: '中性百搭，适合各种场合'
        },
        'gift-cards': {
            loginButton: '登录',
            logoutButton: '退出',
            cartButton: '购物车',
            breadcrumbAllProducts: '全部商品',
            breadcrumbCurrent: '礼品卡',
            categoryTitle: '礼品卡',
            categoryDesc: '完美的数字礼物。通过邮件即时送达，无需运费。选择设计和金额，让收礼人自由挑选。永不过期，可随时线上使用。',
            previewTitle: '预览',
            chooseDesignTitle: '选择设计',
            selectAmountTitle: '选择金额',
            recipientInfoTitle: '收礼人信息',
            senderInfoTitle: '你的信息',
            messageTitle: '留言（可选）',
            addToCartButton: '加入购物车',
            expressCheckoutButton: '快速结账',
            expressBack: '返回礼品卡表单',
            expressLoading: '正在加载支付表单...',
            expressOrderSummary: '订单摘要',
            expressQuantity: '数量',
            expressRecipientEmail: '收礼人邮箱',
            expressSenderEmail: '你的邮箱',
            expressMessage: '留言',
            expressTotal: '总计',
            expressProcessing: '处理中...',
            designRed: '红色',
            designBlue: '蓝色',
            designGreen: '绿色',
            designPurple: '紫色',
            recipientNameLabel: '收礼人姓名',
            recipientEmailLabel: '收礼人邮箱',
            senderNameLabel: '你的姓名',
            senderEmailLabel: '你的邮箱',
            messageLabel: '个性留言',
            previewText: '礼品卡',
            shoppingCartTitle: '购物车',
            emptyCart: '购物车为空',
            proceedCheckout: '去结账',
            loginTitle: '登录',
            usernameLabel: '用户名',
            passwordLabel: '密码',
            loginSubmit: '登录',
            alertLoggedOut: '已退出登录',
            alertLoginSuccess: '登录成功！',
            alertCartEmpty: '购物车为空',
            giftCardName: '礼品卡',
            giftCardAddedPrefix: '礼品卡（',
            giftCardAddedSuffix: '）已加入购物车！',
            designLabel: '设计',
            recipientLabel: '收礼人',
            senderLabel: '送礼人',
            totalLabel: '合计',
            eachLabel: '每件',
            removeButton: '删除'
        },
        checkout: {
            shopName: 'iPhone 手机壳店',
            breadcrumbCart: '购物车',
            breadcrumbShipping: '配送',
            breadcrumbCheckout: '支付',
            shippingAddressTitle: '收货地址',
            shippingCarrierTitle: '配送方式',
            paymentTitle: '付款',
            chooseCarrierButton: '选择配送方式',
            continueCheckout: '继续结账',
            changeButton: '修改',
            payButton: '支付',
            orderSummaryTitle: '订单摘要',
            subtotalLabel: '小计',
            shippingLabel: '运费',
            totalLabel: '总计',
            quantityLabel: '数量',
            designLabel: '设计',
            recipientLabel: '收礼人',
            fromLabel: '送礼人',
            freeLabel: '免费',
            regularCarrier: '普通配送',
            expressCarrier: '快速配送',
            firstNameLabel: '名',
            lastNameLabel: '姓',
            address1Label: '地址第1行',
            address2Label: '地址第2行',
            regionLabel: '地区',
            countryLabel: '国家/地区',
            cardNumberLabel: '卡号',
            cardholderLabel: '持卡人姓名',
            expiryLabel: '有效期 (MM/YY)',
            cvvLabel: 'CVV',
            digitalTitle: '数字礼品卡',
            digitalBody: '这是数字礼品卡，无需填写收货地址。你将通过邮箱收到发送确认。'
        }
    }
};

// Exchange rates (live rates from exchangerate-api.com or similar)
// Base: 1 HKD = X currency
const FX_API_URL = 'https://api.exchangerate-api.com/v4/latest/HKD';

// Fetch live FX rates
async function fetchFXRates() {
    try {
        const response = await fetch(FX_API_URL);
        const data = await response.json();
        fxRates = data.rates;
        console.log('FX rates loaded:', fxRates);
        return fxRates;
    } catch (error) {
        console.error('Failed to fetch FX rates, using fallback rates:', error);
        // Fallback rates (approximate)
        fxRates = {
            HKD: 1,
            USD: 0.128,
            GBP: 0.100,
            AED: 0.470,
            CNY: 0.925,
            JPY: 19.50,
            SGD: 0.172
        };
        return fxRates;
    }
}

// Convert price from HKD to target currency
function convertPrice(hkdPrice, targetCurrency = currentCurrency) {
    if (!fxRates[targetCurrency]) {
        console.warn(`No FX rate for ${targetCurrency}, using HKD`);
        return hkdPrice;
    }
    
    const converted = hkdPrice * fxRates[targetCurrency];
    
    // Round to 2 decimal places for most currencies, 0 for JPY (no decimal)
    if (targetCurrency === 'JPY') {
        return Math.round(converted);
    }
    return Math.round(converted * 100) / 100;
}

// Format price with currency code
function formatPrice(hkdPrice, targetCurrency = currentCurrency) {
    const converted = convertPrice(hkdPrice, targetCurrency);
    
    // Format based on currency
    if (targetCurrency === 'JPY') {
        return `${targetCurrency} ${converted.toLocaleString()}`;
    }
    return `${targetCurrency} ${converted.toFixed(2)}`;
}

// Get current currency
function getCurrentCurrency() {
    return currentCurrency;
}

// Set current currency
function setCurrentCurrency(currency) {
    currentCurrency = currency;
    sessionStorage.setItem('selectedCurrency', currency);
    localStorage.setItem('selectedCurrency', currency);
}

function ensureTranslations() {
    const existing = localStorage.getItem(TRANSLATION_STORAGE_KEY);
    if (!existing) {
        localStorage.setItem(TRANSLATION_STORAGE_KEY, JSON.stringify(DEFAULT_TRANSLATIONS));
        return;
    }

    try {
        const parsed = JSON.parse(existing);
        const merged = { ...parsed };

        Object.keys(DEFAULT_TRANSLATIONS).forEach(locale => {
            if (!merged[locale]) {
                merged[locale] = DEFAULT_TRANSLATIONS[locale];
                return;
            }
            Object.keys(DEFAULT_TRANSLATIONS[locale]).forEach(pageKey => {
                if (!merged[locale][pageKey]) {
                    merged[locale][pageKey] = DEFAULT_TRANSLATIONS[locale][pageKey];
                    return;
                }
                merged[locale][pageKey] = {
                    ...DEFAULT_TRANSLATIONS[locale][pageKey],
                    ...merged[locale][pageKey]
                };
            });
        });

        localStorage.setItem(TRANSLATION_STORAGE_KEY, JSON.stringify(merged));
    } catch (error) {
        console.error('Failed to parse translation map, resetting defaults:', error);
        localStorage.setItem(TRANSLATION_STORAGE_KEY, JSON.stringify(DEFAULT_TRANSLATIONS));
    }
}

function getLocaleForCurrency(currency) {
    if (currency === 'CNY' || currency === 'HKD') {
        return 'zh';
    }
    return 'en';
}

function getCurrentLocale() {
    return getLocaleForCurrency(getCurrentCurrency());
}

function getTranslations(pageKey) {
    ensureTranslations();
    const stored = localStorage.getItem(TRANSLATION_STORAGE_KEY);
    const map = stored ? JSON.parse(stored) : DEFAULT_TRANSLATIONS;
    const locale = getCurrentLocale();
    return map[locale]?.[pageKey] || map.en?.[pageKey] || {};
}

function applyTranslations(pageKey) {
    const translations = getTranslations(pageKey);
    const nodes = document.querySelectorAll('[data-i18n]');
    nodes.forEach(node => {
        const key = node.getAttribute('data-i18n');
        if (translations[key]) {
            node.textContent = translations[key];
        }
    });
}

// Initialize currency selector
function initCurrencySelector(onCurrencyChange) {
    const selector = document.getElementById('currency-selector');
    if (!selector) return;
    
    // Set saved currency
    selector.value = currentCurrency;
    
    // Handle currency change
    selector.addEventListener('change', async (e) => {
        setCurrentCurrency(e.target.value);
        if (onCurrencyChange) {
            onCurrencyChange(e.target.value);
        }
    });
}

// Export functions
window.CurrencyUtils = {
    fetchFXRates,
    convertPrice,
    formatPrice,
    getCurrentCurrency,
    setCurrentCurrency,
    initCurrencySelector,
    ensureTranslations,
    getLocaleForCurrency,
    getCurrentLocale,
    getTranslations,
    applyTranslations
};
