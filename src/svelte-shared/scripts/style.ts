/*
	Use case: This piece of code will change the --main-text-color css variable to "#f45" after 2 seconds.
		let theme={
			main:{
				background:{
					color: "#212121"
				},
				text:{
					color: "#e5d8c1"
				}
			}
		};
		
		//setting css variable
		$: css=style({
			":root":{
				"--main-background-color": theme.main.background.color,
				"--main-text-color": theme.main.text.color,
			},
			"html,body,.card":{
				"background-color": "var(--main-background-color)",
				"color": "var(--main-text-color)",
			}
		});

		setTimeout(()=>{
			theme.main.text.color = "#f45";
		},2000);
*/

export default function style(o:any):string{
	let getStyle=function(o){
		let result = "";
		let keys = Object.keys(o);
		for(let i = 0; i < keys.length; i++){
			let key = keys[i];
			let content = "";
			let keyz = Object.keys(o[key]);
			for(let j = 0; j < keyz.length; j++){
				let k = keyz[j];
				content += k+":"+o[key][k]+";";
			}
			result += key+"{"+content+"}"; 
		}
		return result;
	}
	return "<style>"+getStyle(o)+"</style>";
}