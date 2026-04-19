const fs = require('fs');
const scraperService = require('./services/scraper.service');
const Logger = require('./utils/logger');

(async () => {

    const url = process.argv[2];

    if (!url) {
        Logger.error('Informe a URL do produto!');
        console.log('Exemplo: node src/index.js https://www.netshoes.com.br/...');
        return;
    }

    try {
        const product = await scraperService.getProduct(url);

        Logger.info('Produto extraído com sucesso!');

        console.log(product);

        fs.writeFileSync(
            './outputs/result.json',
            JSON.stringify(product, null, 2)
        );

        Logger.info('Resultado salvo em outputs/result.json');

    } catch (error) {
        Logger.error('Erro ao executar aplicação');
    }

})();