<style>
	/*################# OTHER FRAMEWORK 7 STYLES ###################*/
	/*:global(html){
		overscroll-behavior: none;
	}*/
  	:global(.sidemenu-list .list-button){
		display: grid;
		grid-template-columns: 1fr auto;
		border-bottom: 1px solid rgba(0,0,0,0.125);
	}

	:global(.sidemenu-list .material-icons){
		top: -1.5px;
	}
	:global(*:not(input,textarea)){
		-webkit-touch-callout: none; /* iOS Safari */
		-webkit-user-select: none; /* Safari */
			-khtml-user-select: none; /* Konqueror HTML */
			-moz-user-select: none; /* Old versions of Firefox */
			-ms-user-select: none; /* Internet Explorer/Edge */
					user-select: none; /* Non-prefixed version, currently
												supported by Chrome, Edge, Opera and Firefox */
	}
	:global(.select){
			-webkit-touch-callout: text; /* iOS Safari */
			-webkit-user-select: text; /* Safari */
			-khtml-user-select: text; /* Konqueror HTML */
				-moz-user-select: text; /* Old versions of Firefox */
					-ms-user-select: text; /* Internet Explorer/Edge */
						user-select: text; /* Non-prefixed version, currently
													supported by Chrome, Edge, Opera and Firefox */
	}
	:global(.view.view-main){
		background: #ffffff;
	}
	
	:global(.ios) {
		--f7-ptr-preloader-size: 28px;
		--f7-ptr-size: 44px;
	}
	:global(.md) {
		--f7-ptr-preloader-size: 22px;
		--f7-ptr-size: 40px;
	}
	:global(.aurora) {
		--f7-ptr-preloader-size: 20px;
		--f7-ptr-size: 38px;
	}
</style>