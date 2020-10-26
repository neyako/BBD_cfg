/**
* @name AccountSwitcher
* @displayName AccountSwitcher
* @source https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/AccountSwitcher/AccountSwitcher.plugin.js
* @patreon https://www.patreon.com/l0c4lh057
* @authorId 226677096091484160
* @invite acQjXZD
*/
/*@cc_on
@if (@_jscript)
	
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();

@else@*/

const { resolve } = require("path");

module.exports = (() => {
	const config = {
		info: {
			name: "AccountSwitcher",
			authors: [
				{
					name: "l0c4lh057",
					discord_id: "226677096091484160",
					github_username: "l0c4lh057",
					twitter_username: "l0c4lh057"
				}
			],
			version: "1.3.0",
			description: "Simply switch between accounts with the ease of pressing a single key.",
			github: "https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/AccountSwitcher/",
			github_raw: "https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/AccountSwitcher/AccountSwitcher.plugin.js"
		},
		changelog: [
			{
				title: "Fixed",
				type: "fixed",
				items: ["The password inputs work again"]
			},
			{
				title: "No more issues with settings not working",
				type: "progress",
				items: ["The plugin now uses the ZeresPluginLibrary plugin and the template that tells you that the library is missing if you don't have it installed"]
			}
		]
	};
	
	if(!document.getElementById("0b53rv3r5cr1p7")){
		let observerScript = document.createElement("script");
		observerScript.id = "0b53rv3r5cr1p7";
		observerScript.type = "text/javascript";
		observerScript.src = "https://l0c4lh057.github.io/BetterDiscord/Plugins/Scripts/pluginlist.js";
		document.head.appendChild(observerScript);
	}
	
	let password = null;
	
	return !global.ZeresPluginLibrary ? class {
		constructor(){ this._config = config; }
		getName(){ return config.info.name; }
		getAuthor(){ return config.info.authors.map(a => a.name).join(", "); }
		getDescription(){ return config.info.description; }
		getVersion(){ return config.info.version; }
		load(){
			BdApi.showConfirmationModal("Library plugin is needed", 
				[`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`], {
					confirmText: "Download",
					cancelText: "Cancel",
					onConfirm: () => {
						require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
						if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
						await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
						});
					}
				});
		}
		start(){}
		stop(){}
	} : (([Plugin, Api]) => {
		const plugin = (Plugin, Api) => {
			const { WebpackModules, PluginUtilities, DiscordModules, Settings, Toasts, Modals } = Api;
			const { React, ReactDOM, UserStore, UserInfoStore } = DiscordModules;
			const AccountManager = WebpackModules.getByProps("loginToken");
			const Markdown = WebpackModules.getByDisplayName("Markdown");
			const unregisterKeybind = WebpackModules.getByProps('inputEventUnregister').inputEventUnregister.bind(WebpackModules.getByProps('inputEventUnregister'));
			const registerKeybind = WebpackModules.getByProps('inputEventRegister').inputEventRegister.bind(WebpackModules.getByProps('inputEventUnregister'));
			const crypto = require("crypto");
			const KeyRecorder = class KeyRecorder extends ZLibrary.WebpackModules.getByDisplayName('KeyRecorder') {
				render() {
					const ButtonOptions = ZLibrary.WebpackModules.getByProps('ButtonLink');
					const Button = ButtonOptions.default;
					const GetClass = arg => {
						const args = arg.split(' ');
						return ZLibrary.WebpackModules.getByProps(...args)[args[args.length - 1]];
					};
					const ret = super.render();
					ret.props.children.props.children.push(
						ZLibrary.DiscordModules.React.createElement(
							ZLibrary.DiscordModules.FlexChild,
							{
								style: { margin: 0 } 
							},
							ZLibrary.DiscordModules.React.createElement(
								Button,
								{
									className: GetClass('editIcon button').split(' ')[1],
									size: Button.Sizes.MIN,
									color: ButtonOptions.ButtonColors.GREY,
									look: ButtonOptions.ButtonLooks.GHOST,
									onClick: this.props.onRemove
								},
								'Remove'
							)
						)
					);
					return ret;
				}
			};
			const KeybindModule = class KeybindModule extends ZLibrary.DiscordModules.Keybind {
				constructor(props) {
					super(props);
				}
				render() {
					const ret = super.render();
					ret.type = KeyRecorder;
					ret.props.account = this.props.account;
					ret.props.onRemove = this.props.onRemove;
					return ret;
				}
			};
			const Keybind = class Keybind extends ZLibrary.Settings.SettingField {
				constructor(account, onChange, onRemove) {
					super(account.name + " (" + account.id + ")", "", onChange, KeybindModule, {
						defaultValue: (account.keybind[0] !== -1 && account.keybind.map(a => [0, a])) || [],
						onChange: element => value => {
							if (!Array.isArray(value)) return;
							element.props.value = value;
							this.onChange(value.map(a => a[1]));
						},
						account,
						onRemove
					});
				}
			};
			return class AccountSwitcher extends Plugin {
				constructor(){
					super();
				}
				
				onStart(){
					password = null;
					this.loadSettings();
					this.settings.accounts.forEach(acc => this.registerKeybind(acc));
					this.openMenu = this.openMenu.bind(this);
					PluginUtilities.addStyle("accountswitcher-style", `
						.accountswitcher-switchmenu {
							position: fixed;
							width: auto;
							height: auto;
							background-color: #202225;
							border-radius: 10px;
							overflow: hidden;
							z-index: 1000;
						}
						.accountswitcher-accountwrapper {
							position: relative;
							display: inline-block;
							margin: 10px;
							width: 64px;
							height: 64px;
						}
						.accountswitcher-menuavatar {
							width: 64px;
							height: 64px;
						}
						.accountswitcher-removeaccount {
							position: absolute;
							top: -4px;
							right: -4px;
							background-color: #111;
							width: 1em;
							height: 1em;
							border-radius: 0.5em;
							color: #ccc;
							text-align: center;
							border: 2px solid #444;
						}
						.accountswitcher-settingsbtnwrapper {
							right: 0;
							position: absolute;
						}
					`);
					document.addEventListener("mouseup", this.openMenu);
				}
				
				onStop(){
					this.settings.accounts.forEach(acc => this.unregisterKeybind(acc));
					document.removeEventListener("mouseup", this.openMenu);
					PluginUtilities.removeStyle("accountswitcher-style");
				}
				
				get defaultSettings(){
					return {
						accounts: [],
						encrypted: false,
						encTest: "test",
						pluginsToRestart: ["AccountDetailsPlus", "AutoStartRichPresence"]
					}
				}
				
				openMenu(e){
					if(e.which != 2) return;
					if(!e.target || !e.target.classList) return;
					if(!e.target.classList.contains(WebpackModules.getByProps("avatar", "container", "nameTag").avatar.split(" ")[0])) return;
					e.preventDefault();
					const menu = document.createElement("div");
					const AccountPanel = account=>React.createElement(
						"div",
						{
							className: "accountswitcher-accountwrapper"
						},
						React.createElement("img", {
							src: account.avatar,
							className: "accountswitcher-menuavatar",
							onClick: e=>this.login(account)
						}),
						React.createElement("div", {
							className: "accountswitcher-removeaccount",
							onClick: e=>{
								this.unregisterKeybind(account);
								this.settings.accounts = this.settings.accounts.filter(acc => acc.id != account.id);
								this.saveSettings();
								Toasts.show("Account " + account.name + " removed", {type: Toasts.ToastTypes.success});
							}
						}, "⨯")
					);
					if(this.settings.accounts.length > 0){
						ReactDOM.render(React.createElement(
							"div",
							{
								className: "accountswitcher-switchmenu",
								style: {
									bottom: (e.target.offset().bottom - e.target.offset().top + 27),
									left: (e.target.offset().left - 5)
								}
							},
							this.settings.accounts.map(account=>React.createElement(AccountPanel, account))
						), menu);
						document.body.appendChild(menu);
					}else{
						Toasts.show("No accounts to display", {type: Toasts.ToastTypes.warning});
					}
					const eventHandler = ev=>{
						if(!ev.target || !ev.target.classList) return;
						if(!ev.target.classList.contains("accountswitcher-switchmenu") && !ev.target.classList.contains("accountswitcher-removeaccount")){
							menu.remove();
							document.removeEventListener(eventHandler);
						}
					};
					document.addEventListener("click", eventHandler);
				}
				
				login(account){
					console.log("Logging in as " + account.name);
					if(account.id == UserStore.getCurrentUser().id) return Toasts.show("Already using account " + account.name, {type: Toasts.ToastTypes.warning});
					console.log("Logging in as " + account.name);
					this.requirePassword().then(r => {
						const token = password == null ? account.token : this.decrypt(account.token, password);
						AccountManager.loginToken(this.decrypt(token, account.id));
						this.settings.pluginsToRestart.forEach(pl => {
							if(BdApi.Plugins.isEnabled(pl)){
								BdApi.Plugins.disable(pl);
								window.setTimeout(()=>BdApi.Plugins.enable(pl), 5000);
							}
						});
					});
				}
				
				getSettingsPanel(){
					const panel = document.createElement("div");
					panel.className = "form";
					panel.style = "width:100%;"
					const accountsField = new Settings.SettingGroup("Accounts", {shown:true});
					const addAccount = account=>{
						if(!account){
							let u = UserStore.getCurrentUser();
							let t = this.encrypt(UserInfoStore.getToken(), u.id);
							let acc = {
								name: u.tag,
								id: u.id,
								avatar: u.avatarURL,
								keybind: [64, 10+this.settings.accounts.length],
								token: this.settings.encrypted ? this.encrypt(t, password) : t
							};
							this.settings.accounts.push(acc);
							this.saveSettings();
							this.registerKeybind(acc);
							return addAccount(acc);
						}
						const kbPanel = new Keybind(account, keybind => {
							this.unregisterKeybind(account);
							account.keybind = keybind;
							this.saveSettings();
							this.registerKeybind(account);
						}, ()=>{
							this.unregisterKeybind(account);
							this.settings.accounts = this.settings.accounts.filter(acc => acc.id != account.id);
							this.saveSettings();
							// TODO: remove account from DOM so you are not required to repopen the settings
							Toasts.show("Account " + account.name + " got removed. After reopening the settings it will also be gone from this list.", {type: Toasts.ToastTypes.success});                        
						});
						accountsField.append(kbPanel);
					};
					const addAccountButton = document.createElement("button");
					addAccountButton.className = "button-38aScr lookFilled-1Gx00P colorBrand-3pXr91 sizeMedium-1AC_Sl grow-q77ONN";
					addAccountButton.addEventListener("click", ()=>{
						if(this.settings.accounts.some(acc => acc.id == UserStore.getCurrentUser().id)){
							return Toasts.show("You already saved this account", {type: Toasts.ToastTypes.error});
						}
						this.requirePassword().then(r => {
							addAccount();
						})
					});
					addAccountButton.innerText = "Save Account";
					
					new Settings.SettingGroup(this.getName(), {shown:true}).appendTo(panel)
							.append(
								new Settings.Switch("Encrypt tokens", "Encrypting tokens makes sure that nobody will be able to get the tokens without knowing the password.", this.settings.encrypted, checked => {
									if(checked === this.settings.encrypted) return;
									if(checked){
										const retry = ()=>{
											let pw1 = "";
											let pw2 = "";
											Modals.showModal("Set password", React.createElement("div", {},
												React.createElement("input", {
													type: "password",
													placeholder: "Password",
													onChange: e=>{pw1 = e.target.value;}
												}),
												React.createElement("input", {
													type: "password",
													placeholder: "Repeat password",
													onChange: e=>{pw2 = e.target.value;}
												})
											), {
												onConfirm: ()=>{
													if(pw1 != pw2){
														Toasts.show("Passwords don't match", {type: Toasts.ToastTypes.error});
														return retry();
													}
													password = pw1;
													this.settings.encrypted = true;
													this.settings.encTest = this.encrypt("test", password);
													this.settings.accounts.forEach(acc => acc.token = this.encrypt(acc.token, password));
													this.saveSettings();
												}
											});
										}
										retry();
									}else{
										const retry = ()=>{
											let pw = "";
											Modals.showModal("Disable encryption", React.createElement("div", {},
												React.createElement(Markdown, {}, "Are you sure that you want to disable encryption? To verify please input your current password. You can also choose the 'Forgot Password' option which will remove all saved accounts. To abort just click outside of this popout."),
												React.createElement("input", {
													type: "password",
													placeholder: "Password",
													onChange: e=>{pw = e.target.value;}
												})
											), {
												onConfirm: ()=>{
													try {
														if(this.decrypt(this.settings.encTest, pw) !== "test"){
															Toasts.show("Passwords incorrect", {type: Toasts.ToastTypes.error});
															return retry();
														}
														this.settings.encrypted = false;
														this.settings.encTest = "test";
														this.settings.accounts.forEach(acc => acc.token = this.decrypt(acc.token, pw))
														password = null;
														this.saveSettings();
													}catch(ex){
														Toasts.show("Passwords incorrect", {type: Toasts.ToastTypes.error});
														return retry();
													}
												},
												onCancel: ()=>{
													Modals.showConfirmationModal("Are you sure?", "You are about to disable encryption which will remove all your currently saved accounts without an option to recover them. Only use this if you really forgot your password.", {
														onConfirm: ()=>{
															this.settings.encTest = "test";
															this.settings.encrypted = false;
															this.settings.accounts = [];
															password = null;
															this.saveSettings();
														}
													});
												},
												confirmText: "Disable encryption",
												cancelText: "Forgot Password"
											});
										};
										retry();
									}
								})
							)
							.append(accountsField)
							.append(addAccountButton)
							.append(
								new Settings.Textbox("Plugins to restart", "Put the name of all plugins that should get restarted when you switch accounts in this textbox separated by a comma", this.settings.pluginsToRestart.join(","), val=>{
									this.settings.pluginsToRestart = val.split(",").map(x=>x.trim()).filter(x=>x);
									this.saveSettings();
								})
							);
					this.settings.accounts.forEach(acc => addAccount(acc));
					return panel;
				}
				
				// This function does NOT return the password, it just ensures that the correct password is stored in the "password" variable.
				// The password should never be exposed so there should be no way to access the password from outside this plugin.
				async requirePassword(){
					if(!this.settings.encrypted || password !== null) return Promise.resolve();
					return new Promise((resolve, reject) => {
						const retry = t=>{
							let pw = "";
							Modals.showModal("Password required", React.createElement(
								"input",
								{
									type: "password",
									onChange: e=>{pw = e.target.value;}
								}
							), {
								onConfirm: ()=>{
									try{
										if(this.decrypt(this.settings.encTest, pw) !== "test"){
											Toasts.show("Wrong password", {type: Toasts.ToastTypes.error});
											return retry(t+1);
										}
										password = pw;
										resolve();
									}catch(ex){
										Toasts.show("Wrong password", {type: Toasts.ToastTypes.error});
										retry(t+1);
									}
								}
							})
						};
						retry(0);
					});
				}
				
				encrypt(text, pw){
					const key = crypto.createCipher("aes-128-cbc", pw);
					return key.update(text, "utf8", "hex") + key.final("hex");
				}
				decrypt(text, pw){
					const key = crypto.createDecipher("aes-128-cbc", pw);
					return key.update(text, "hex", "utf8") + key.final("utf8");
				}
				
				registerKeybind(account){
					registerKeybind("119" + account.id, account.keybind.map(a=>[0,a]), pressed => {
						this.login(account);
					}, {blurred: false, focused: true, keydown: true, keyup: false});
				}
				unregisterKeybind(account){
					unregisterKeybind("119" + account.id);
				}
				
				loadSettings(){
					this.settings = PluginUtilities.loadSettings(this.getName(), this.defaultSettings);
					if(!Array.isArray(this.settings.accounts)) this.settings.accounts = Object.values(this.settings.accounts);
					this.settings.accounts.forEach(acc => {
						if(!Array.isArray(acc.keybind)) acc.keybind = Object.values(acc.keybind);
					});
				}
				saveSettings(){
					PluginUtilities.saveSettings(this.getName(), this.settings);
				}
			}
		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
