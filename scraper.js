const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeChicagoPrices() {
    let browser;

    try {
        console.log('[INFO] Iniciando Puppeteer...');
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0');
        await page.goto('https://www.bolsadecereales.com/precios-internacionales', {
            waitUntil: 'networkidle2',
        });

        console.log('[INFO] Extrayendo datos...');
        const datosChicago = await page.evaluate(() => {
            const bloqueChicago = [...document.querySelectorAll('div.bloque-tabla')].find(div => {
                const titulo = div.querySelector('.titulo-tabla');
                return titulo && titulo.textContent.trim() === 'Chicago';
            });
            if (!bloqueChicago) return [];

            const filas = bloqueChicago.querySelectorAll('table.tabla-cotizaciones tbody tr');
            const resultados = [];

            filas.forEach(tr => {
                const celdas = tr.querySelectorAll('td');
                if (celdas.length === 4) {
                    const producto = celdas[0].innerText.trim();
                    const posicion = celdas[1].innerText.trim();
                    const cierre = celdas[2].innerText.trim();
                    const variacion = celdas[3].innerText.trim();

                    if (producto && producto.toLowerCase() !== 'producto' && posicion !== '') {
                        resultados.push({ producto, posicion, cierre, variacion });
                    }
                }
            });

            return resultados;
        });

        const filtrados = datosChicago.filter(item =>
            (item.producto === 'Maíz' && item.posicion === 'Jul2025') ||
            (item.producto === 'Soja' && item.posicion === 'Jul2025') ||
            (item.producto === 'Trigo Chicago' && item.posicion === 'Sep2025')
        );

        console.log('[INFO] Guardando resultados en JSON...');
        fs.writeFileSync('preciosChicago.json', JSON.stringify(filtrados, null, 2));

        await browser.close();
        console.log('[INFO] Scraping finalizado con éxito.');

    } catch (err) {
        if (browser) await browser.close();
        console.error('[ERROR] Hubo un problema:', err);
    }
}

scrapeChicagoPrices();
