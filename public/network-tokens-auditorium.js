(function () {
    const STORAGE_KEY = 'networkTokensAuditoriumLang';
    const toggleButton = document.getElementById('auditorium-lang-toggle');

    function applyLanguage(lang) {
        const effectiveLang = lang === 'zh' ? 'zh' : 'en';
        const i18nNodes = document.querySelectorAll('[data-i18n-en][data-i18n-zh]');
        const ariaNodes = document.querySelectorAll('[data-aria-en][data-aria-zh]');

        i18nNodes.forEach(function (node) {
            const text = effectiveLang === 'zh' ? node.dataset.i18nZh : node.dataset.i18nEn;
            node.textContent = text;
        });

        ariaNodes.forEach(function (node) {
            const label = effectiveLang === 'zh' ? node.dataset.ariaZh : node.dataset.ariaEn;
            node.setAttribute('aria-label', label);
        });

        document.documentElement.lang = effectiveLang === 'zh' ? 'zh-Hans' : 'en';

        if (toggleButton) {
            toggleButton.dataset.lang = effectiveLang;
            toggleButton.textContent = effectiveLang === 'zh' ? 'English' : '简体中文';
            toggleButton.setAttribute(
                'aria-label',
                effectiveLang === 'zh' ? 'Switch language to English' : '切换为简体中文'
            );
        }

        try {
            localStorage.setItem(STORAGE_KEY, effectiveLang);
        } catch (err) {
            // Ignore storage errors in restricted browser contexts.
        }
    }

    function getPreferredLanguage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'zh' || stored === 'en') {
                return stored;
            }
        } catch (err) {
            // Ignore storage errors in restricted browser contexts.
        }

        return 'en';
    }

    if (toggleButton) {
        toggleButton.addEventListener('click', function () {
            const current = toggleButton.dataset.lang === 'zh' ? 'zh' : 'en';
            applyLanguage(current === 'zh' ? 'en' : 'zh');
        });
    }

    applyLanguage(getPreferredLanguage());
})();
