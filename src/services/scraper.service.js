const puppeteer = require('puppeteer');
const Product = require('../models/product.model');
const Logger = require('../utils/logger');

class ScraperService {

    async getProduct(url) {
        let browser;

        try {
            Logger.info('Abrindo navegador...');

            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
            );

            await page.setViewport({ width: 1366, height: 768 });

            Logger.info('Acessando página...');

            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });

            // Espera título aparecer
            await page.waitForSelector('h1', { timeout: 15000 });

            // Pequeno delay (fallback)
            await new Promise(resolve => setTimeout(resolve, 1500));

            Logger.info('Extraindo dados...');

            // Extrai direto do browser (mais confiável que cheerio aqui)
            const data = await page.evaluate(() => {
                const getText = (selector) =>
                    document.querySelector(selector)?.innerText?.trim() || '';

                const getAttr = (selector, attr) =>
                    document.querySelector(selector)?.getAttribute(attr) || '';

                return {
                    title: getText('h1'),
                    price:
                        getText('[data-testid="price"]') ||
                        getText('.price') ||
                        getText('[class*="price"]'),
                    image: getAttr('img', 'src'),
                    description: getAttr('meta[name="description"]', 'content')
                };
            });

            // Validação de página inválida
            const isErrorPage =
                !data.title ||
                data.title.toLowerCase().includes('ops') ||
                data.title.toLowerCase().includes('não encontrada');

            if (isErrorPage) {
                Logger.error('Página inválida detectada!');
                throw new Error('Produto não encontrado ou removido');
            }

            Logger.info(`Título: ${data.title}`);
            Logger.info(`Preço: ${data.price || 'Não encontrado'}`);

            return new Product(
                data.title,
                data.price || 'Preço não encontrado',
                data.image,
                data.description
            );

        } catch (error) {
            Logger.error(error.message);
            console.error(error);
            throw error;

        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}

module.exports = new ScraperService();