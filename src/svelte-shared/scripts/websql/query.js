import database from '../../stores/WebSQL/database.js';

export default async function query(sql,...params){
	return new Promise(resolve=>{
		(database.subscribe($database=>{
			$database.transaction(tx=>{
				tx.executeSql(sql,params,(tx,results)=>{
					resolve(results.rows);
				});
			});
		}))();
	});
}