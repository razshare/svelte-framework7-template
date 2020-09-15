<style>
	:global(.full-width){
    width: 100%;
  }
  :global(.full-height){
    height: 100%;
  }
  :global(.border-radius-0){
    border-radius: 0;
  }
	:global(.float-left){
    float: left;
  }
  :global(.float-right){
    float: right;
  }
  :global(hr){
		border: 0;
		height: 1px;
		background: rgba(0,0,0,0.125);
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
  :global(html){
    overscroll-behavior: none;
  }
</style>