from pathlib import Path
from playwright.sync_api import sync_playwright
p=Path('/mnt/data/ACC_BTS_Offline_Demo_v3.html')
errors=[]
html=p.read_text()
def show(page):
    page.evaluate("""() => {window._store ||= {};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window._store[k]||null,setItem:(k,v)=>window._store[k]=v}})}""")
    page.set_content(html)
with sync_playwright() as pl:
    browser=pl.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
    page.on('pageerror',lambda e:errors.append(str(e)))
    show(page);page.wait_for_timeout(300)
    page.locator('[data-action="more"]').click()
    page.locator('.more-menu [data-id="board"]').click()
    assert page.locator('h1').first.inner_text()=='Connections board'
    assert page.locator('#board-focus').input_value()=='story:Missing Turkey'
    page.locator('#board-focus').select_option('All')
    assert page.locator('.evidence-card.story').count()>=10
    assert page.locator('.evidence-card.card').count()==4
    assert page.locator('.connection-item').count()==3
    print('Mobile initial board',page.locator('.evidence-card.story').count(),'stories',page.locator('.evidence-card.card').count(),'cards')
    page.screenshot(path='/mnt/data/ACC_BTS_v3_mobile_board.png',full_page=True)
    # focus board
    page.locator('#board-focus').select_option('story:Missing Turkey')
    assert page.locator('.evidence-card.story').count()==2
    page.locator('#board-focus').select_option('All')
    # add edited connection
    page.locator('[data-action="board-new"]').first.click()
    form=page.locator('#board-link-form')
    form.locator('[name="source_key"]').select_option('story:Understudy Conspiracy')
    form.locator('[name="target_key"]').select_option('story:Missing Turkey')
    form.locator('[name="relation"]').select_option('Clue')
    form.locator('[name="description"]').fill('Understudy has seen the missing prop.')
    form.locator('button[type="submit"]').click()
    assert page.locator('.connection-item').count()==4
    assert page.get_by_text('Understudy has seen the missing prop.').count()==1
    page.screenshot(path='/mnt/data/ACC_BTS_v3_mobile_connections.png',full_page=True)
    # rename from pinned node, live update all references
    page.locator('[data-action="board-node"][data-id="story:Missing Turkey"]').click()
    page.locator('[data-action="board-story-rename"]').click()
    form=page.locator('#rename-story-form')
    form.locator('[name="new_name"]').fill('Turkey Investigation')
    form.locator('button[type="submit"]').click()
    assert page.locator('[data-action="board-node"][data-id="story:Turkey Investigation"]').count()==1
    assert page.locator('[data-action="board-node"][data-id="story:Missing Turkey"]').count()==0
    assert page.locator('select#board-focus option[value="story:Turkey Investigation"]').count()==1
    # verify original links migrated and persisted reload
    previous=page.evaluate('window._store')
    page.close()
    page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.evaluate('(saved) => window._store=saved',previous)
    show(page);page.wait_for_timeout(250)
    page.locator('[data-action="more"]').click()
    page.locator('.more-menu [data-id="board"]').click()
    assert page.locator('.connection-item').count()==4
    assert page.locator('[data-action="board-node"][data-id="story:Turkey Investigation"]').count()==1
    # edit actor card thread updates auto link to different story and name sync
    page.locator('[data-action="board-node"][data-id="card:AC-001"]').click()
    page.locator('[data-action="edit-cards"]').click()
    form=page.locator('#editor-form')
    form.locator('[name="scene_title"]').fill('Jim — the construction legend')
    form.locator('[name="thread"]').fill('Turkey Investigation')
    form.locator('button[type="submit"]').click()
    page.locator('#board-focus').select_option('story:Turkey Investigation')
    assert page.locator('[data-action="board-node"][data-id="card:AC-001"]').count()==1
    # delete newly added link
    page.on('dialog',lambda d:d.accept())
    page.locator('.connection-item').filter(has_text='Understudy has seen the missing prop.').locator('[data-action="board-delete"]').click()
    page.wait_for_timeout(100)
    assert page.locator('.connection-item').count()==3
    # screenshots no console errors
    print('Mobile PASS')
    desk=browser.new_page(viewport={'width':1440,'height':900})
    desk.on('pageerror',lambda e:errors.append(str(e)))
    show(desk);desk.wait_for_timeout(200)
    desk.locator('.sidebar [data-id="board"]').click()
    assert desk.locator('.evidence-card.story').count()>=10
    desk.screenshot(path='/mnt/data/ACC_BTS_v3_desktop_board.png',full_page=True)
    print('Desktop PASS',len(errors),'errors')
    assert not errors,errors
    browser.close()
