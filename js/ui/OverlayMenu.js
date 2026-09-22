export class OverlayMenu {
  static clear(){document.querySelectorAll('.menu-screen').forEach(e=>e.remove());}
  static show({title,subtitle='',buttons=[]}){this.clear();const root=document.getElementById('dom-overlay');const screen=document.createElement('div');screen.className='menu-screen';const panel=document.createElement('div');panel.className='menu-panel';panel.innerHTML=`<h1>${title}</h1><p>${subtitle}</p><div class="menu-grid"></div>`;const grid=panel.querySelector('.menu-grid');buttons.forEach(b=>{const btn=document.createElement('button');btn.className=`menu-button ${b.danger?'danger':''}`;btn.textContent=b.label;btn.addEventListener('click',()=>b.onClick?.());grid.appendChild(btn);});screen.appendChild(panel);root.appendChild(screen);return screen;}
}
