export default function QueryStringBuilder(url){
	let queries = {
		/*<COL_NAME>: {
			equals: {},
			notEquals: {},
			greaterThan: {},
			lesserThan: {},
			empty: {},
			notEmpty: {},
			between: {},
		}*/
	};

	this.like=function(key,value){
		this.equals(key,"%"+value+"%");
	}

	this.equals=function(key,value){
		if(!queries[key+""]) queries[key+""] = {};
		if(!queries[key+""].equals) queries[key+""].equals = [];
		queries[key+""].equals.push(value+"");
		return this;
	};
	this.notEquals=function(key,value){
		if(!queries[key+""]) queries[key+""] = {};
		if(!queries[key+""].notEquals) queries[key+""].notEquals = [];
		queries[key+""].notEquals.push(value+"");
		return this;
	};
	this.greaterThan=function(key,value){
		if(!queries[key+""]) queries[key+""] = {};
		if(!queries[key+""].greaterThan) queries[key+""].greaterThan = [];
		queries[key+""].greaterThan.push(value+"");
		return this;
	};
	this.lesserThan=function(key,value){
		if(!queries[key+""]) queries[key+""] = {};
		if(!queries[key+""].lesserThan) queries[key+""].lesserThan = [];
		queries[key+""].lesserThan.push(value+"");
		return this;
	};
	this.empty=function(key){
		if(!queries[key+""]) queries[key+""] = {};
		if(!queries[key+""].empty) queries[key+""].empty = true;
		return this;
	};
	this.notEmpty=function(key){
		if(!queries[key+""]) queries[key+""] = {};
		if(!queries[key+""].notEmpty) queries[key+""].notEmpty = true;
		return this;
	};
	this.between=function(key,start,end){
		if(!queries[key+""]) queries[key+""] = {};
		if(!queries[key+""].between) queries[key+""].between = [];
		queries[key+""].between.push({start,end});
		return this;
	};

	this.toString=function(){
		let qss = new Array();
		for(let colmnName in queries){
			let operations = queries[colmnName];
			let qs = "";
			let i = 0;
			for(let operationName in operations){
				switch(operationName){
					case "equals":
						qs += encodeURIComponent(colmnName)
						qs += i > 0?";":"="
						for(let j = 0; j < operations[operationName].length; j++){
							qs += (j>0?';=':'')+encodeURIComponent(operations[operationName][j]);
						}
					break;
					case "notEquals":
						qs += encodeURIComponent(colmnName)
						qs += i > 0?";":"=#"
						for(let j = 0; j < operations[operationName].length; j++)
							qs += (j>0?';=#':'')+encodeURIComponent(operations[operationName][j]);
					break;
					case "greaterThan":
						qs += encodeURIComponent(colmnName)
						qs += i > 0?";":"=>"
						for(let j = 0; j < operations[operationName].length; j++)
							qs += (j>0?';=>':'')+encodeURIComponent(operations[operationName][j]);
					break;
					
					case "lesserThan":
						qs += encodeURIComponent(colmnName)
						qs += i > 0?";":"=<"
						for(let j = 0; j < operations[operationName].length; j++)
							qs += (j>0?';=<':'')+encodeURIComponent(operations[operationName][j]);
					break;
					
					case "empty":
						qs += encodeURIComponent(colmnName)
						qs += i > 0?";":"="
						qs += operations[operationName]? "!":""
					break;

					case "notEmpty":
						qs += encodeURIComponent(colmnName)
						qs += i > 0?";":"="
						qs += operations[operationName]? ".":""
					break;

					case "between":
						qs += encodeURIComponent(colmnName)
						qs += i > 0?";":"="
						for(let j = 0; j < operations[operationName].length; j++)
							qs += (j>0?';':'')+encodeURIComponent(operations[operationName][j].start)+":"+encodeURIComponent(operations[operationName][j].end);
					break;
				}
				i++;
			}
			qss.push(qs);
		}

		return url+"?"+qss.join("&");
	}
}