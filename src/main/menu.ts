import {
  Menu,
  BrowserWindow,
} from 'electron';

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    const template = this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }
  
  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '&Domů',
        click: async()=>{
          this.mainWindow.webContents.send("navigate", "/");
        }
      },
      {
        label: '&Výsledky',       
        click: async()=>{
          this.mainWindow.webContents.send("navigate", "/Results");
        } 
      },      
      {
        label: '&Historie',
        click: async()=>{
          this.mainWindow.webContents.send("navigate", "/History");
        } 
      },
      {
        label: '&Týmy',
        click: async()=>{
          this.mainWindow.webContents.send("navigate", "/Teams");
        } 
      },
      {
        label: '&Ligy',
        click: async()=>{
          this.mainWindow.webContents.send("navigate", "/Leagues");
        } 
      },
      {
        label: '&Kalibrace',
        click: async()=>{
          this.mainWindow.webContents.send("navigate", "/Calibration");
        } 
      },     
    ];

    return templateDefault;
  }
}
