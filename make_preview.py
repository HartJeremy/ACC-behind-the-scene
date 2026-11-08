from pathlib import Path
p=Path('/mnt/data/acc-behind-scenes-pwa')
css=(p/'src/style.css').read_text()
seed=(p/'src/seed.js').read_text().replace('export const initialData','const initialData',1)
app=(p/'src/app.js').read_text()
app=app.replace("import { initialData } from './seed.js';",'').replace("import { cloudConfig } from '../config.js';",'')
# One-file demo, never attempts shared cloud auth. This is distinct from deployable source.
js=seed+'\nconst cloudConfig = {url:"",publishableKey:""};\n'+app
html='<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/><meta name="theme-color" content="#0d121e"/><title>ACC · Behind the Scenes — Demo</title><style>'+css+'</style></head><body><div id="app"></div><div id="modal-root"></div><div id="toast" aria-live="polite"></div><script>'+js.replace('</script>','<\\/script>')+'</script></body></html>'
(p/'ACC_BTS_Offline_Demo.html').write_text(html,encoding='utf-8')
print('demo bytes',len(html))
