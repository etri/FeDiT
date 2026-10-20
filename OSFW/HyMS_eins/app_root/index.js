const express = require('express')
const req_ip = require('request-ip')
const app = express()
const port = 8081
const db = require('./lib/db_conn');
const cors = require("cors");
const fs = require('fs')
const request = require('request')

function mkdir( dirPath ) {
    const isExists = fs.existsSync( dirPath );
    if( !isExists ) {
        fs.mkdirSync( dirPath, { recursive: true } );
    }
}
 















app.use(express.json({
    limit : "50mb"
}));
app.use(express.urlencoded({
    limit:"50mb",
    extended: false
}));
 
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//app.use(cors());
app.use(cors({
    origin: '*',
	methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH']
}));

function leftPad(v){
 	if(v >= 10){
		return v;
	}
	else{
		return '0' + v;
	}
}
app.post('/get_model_info', (req, res) => {
	let q = Object.keys(req.query).length === 0 ? req.body:req.query;
	if(q.project_name === undefined || q.project_name == ''
		|| q.file_name === undefined || q.file_name == ''
	){
		res.send({result : "error param"});
		console.log("error param");
		return;
	}
	let ext = q.file_name.substring(q.file_name.lastIndexOf('.'), q.file_name.length).toLowerCase();
	let sql, params;
	if(ext == '.json'){
		sql = "call get_coupled(?, ?, ?)";
		params = [q.project_name, q.file_name, q.uid];
	}
	else if(ext == '.py' || ext == '.dll' || ext == '.m'){
		sql = "call get_atomic(?, ?, ?)";
		params = [q.project_name, q.file_name, q.uid];
	}
	else{
		res.send({result : "error filename"});
		console.log("error filename");
		return;
	}
	console.log(sql, params);
	db.query(sql, params, (err, data) => {
		if(!err) res.send({ result : 1, data:data });
		else res.send({result:0, data:err});
	})
});

app.post('/get_project_list', (req, res) => {
	sql = "call get_project_list()";
	console.log(sql);
	db.query(sql, (err, data) => {
		if(!err) {
			res.send({ result : 1, data:data });
		}
		else {
			res.send({result:0, data:err});
		}
	})
});

app.post('/get_model_list', (req, res) => {
	let q = Object.keys(req.query).length === 0 ? req.body:req.query;
	console.log(q);
	if(q.project_name === undefined || q.project_name == ''
	){
		res.send({result : "error param"});
		return;
	}
	let sql = "call get_model_list(?)";
	let params = [q.project_name];
	console.log(sql, params);
	db.query(sql, params, (err, data) => {
		if(!err) res.send({ result : 1, data:data });
		else res.send({result:0, data:err});
	})
});

app.post('/get_coupled_info', (req, res) => {
	let q = Object.keys(req.query).length === 0 ? req.body:req.query;
	if(q.uid === undefined || q.uid == ''
	){
		res.send({result : "error"});
		console.log("error");
		return;
	}
	let sql = "call get_coupled('', '', ?)";
	let params = [q.uid];
	db.query(sql, params, (err, data) => {
		if(!err) res.send({ result : 1, data:data });
		else res.send({result:0, data:err});
	})
});

app.post('/set_coupled_info',(req, res) => {
	let q = Object.keys(req.query).length === 0 ? req.body:req.query;
	if(q.project_name === undefined || q.project_name == ''
		|| q.model_name === undefined || q.model_name == ''
		|| q.file_name === undefined || q.file_name == ''
		|| q.json_data === undefined || q.json_data == ''
	){
		res.send({result : "error"});
		console.log(q);
		return;
	}

	if(q.image !== undefined){
		// path traversal 방지
		let safeProjName = q.project_name.replace(/[\/\\\.\.]/g, '_');
		let safeFileName = q.file_name.replace(/[\/\\\.\.]/g, '_');
		let p1 = q.image.indexOf(',');
		let img = q.image.substring(p1+1);
		let decode = Buffer.from(img, 'base64');
		mkdir('./thumbnails/' + safeProjName);
		fs.writeFileSync('./thumbnails/' + safeProjName + '/' + safeFileName + '.jpg', decode);
	}

	let in_json = JSON.parse(q.json_data);

	// update_coupled 프로시저는 없는 프로젝트면 projects 에 넣은 뒤 그 pk 를 다시 읽지 않고
	// project_no=0 으로 insert 해 FK 오류가 난다. 프로젝트 행을 먼저 만들어 두면 기존 프로젝트 경로를 탄다.
	let sql = "insert into projects (project_name, updated) select ?, now() from dual "
		+ "where not exists (select 1 from projects where project_name = ?); "
		+ "call update_coupled(?, ?, ?, ?, ?)";
	let params = [q.project_name, q.project_name, in_json.uid, q.project_name, q.model_name, q.file_name, q.json_data];

	console.log(sql, params);
	db.query(sql, params, (err, data) => {
		console.log(data);
		if(!err) res.send({ result : 1 });
		else{
			console.log(err);
			res.send({result:0, data:err});
		} 
	})
});

app.post('/get_atomic_info', (req, res) => {
	let q = Object.keys(req.query).length === 0 ? req.body:req.query;
	if(q.project_name === undefined || q.project_name == ''
		|| q.file_name === undefined || q.file_name == ''
	){
		res.send({result : "error"});
		console.log("error");
		return;
	}
	let sql = "call get_atomic(?, ?)";
	let params = [q.project_name, q.file_name];
	db.query(sql, params, (err, data) => {
		if(!err) res.send({ result : 1, data:data });
		else res.send({result:0, data:err});
	})
});

app.post('/set_atomic_info',(req, res) => {
	let q = Object.keys(req.query).length === 0 ? req.body:req.query;
	console.log(q);
	if(q.project_name === undefined || q.project_name == ''){
		res.send({result : "error : project_name is null"});
		return;
	}
	else if(q.model_name === undefined || q.model_name == ''){
		res.send({result : "error : model_name is null"});
		return;
	}
	else if(q.model_type === undefined){
		res.send({result : "error : model_type is null"});
		return;
	}
	else if(q.file_name === undefined || q.file_name == ''){
		res.send({result : "error : file_name is null"});
		return;
	}
	else if(q.file_path === undefined || q.file_path == ''){
		res.send({result : "error : file_path is null"});
		return;
	}
	else if(q.ip === undefined || q.ip == ''){
		res.send({result : "error : local_ip is null"});
		return;
	}
	else if(q.iid === undefined || q.iid == ''){
		res.send({result : "error : iid is null"});
		return;
	}
	let location = q.ip + ':' + q.port;
	// atomic_model_manager 는 model_id(iid)를 "프로젝트/파일명" 으로 만든다. 예전에는 파일명만 써서
	// 프로젝트가 달라도 같은 이름이면 한 행을 덮어썼다. 같은 프로젝트·파일에 남아 있는 예전 id 의
	// 행은 지우고 새 id 로 등록해, 한 모델이 목록에 두 번 나오지 않게 한다.
	let sql = "delete m from atomic_models m join projects p on p.pk = m.project_no "
		+ "where p.project_name = ? and m.file_name = ? and m.model_id <> ?; "
		+ "call update_atomic(?, ?, ?, ?, ?, ?, ?)";
	let params = [String(q.project_name), String(q.file_name), String(q.iid),
		q.iid, q.project_name, q.model_type, q.model_name, q.file_name, location, JSON.stringify(q)];

	console.log(sql, params);
	db.query(sql, params, (err, data) => {
		console.log(data);
		if(!err) res.send({ result : 1 });
		else{
			console.log(err);
			res.send({result:0, data:err});
		} 
	});
});

app.listen(port, '0.0.0.0', () => {
  console.log(`listening on port ${port}`)
})


app.post('/get_atomic_list', (req, res) => {
	sql = "call get_atomic_list()";
	console.log(sql);
	db.query(sql, (err, data) => {
		if(!err) {
			res.send({ result : 1, data:data });
		}
		else {
			res.send({result:0, data:err});
		}
	})
});

// ----- 원자모델 관리 창 (web_root/scripts2/atomic_upload.js) -----

// default_model_setup 이 넣는 기본 기능 모델(print, graph 2d ...)은 지우지 않는다.
const BUILTIN_MODEL_TYPE = 10000;

// set_coupled_info 와 같은 규칙으로 썸네일 경로를 만든다.
function thumbnail_path(project_name, file_name){
	return './thumbnails/' + project_name.replace(/[\/\\\.\.]/g, '_') + '/' + file_name.replace(/[\/\\\.\.]/g, '_') + '.jpg';
}

// 커플드 모델은 하위 모델을 file_path(프로젝트) + file_name 으로 참조한다(중첩 포함).
// file_path 가 없는 하위 커플드 모델은 상위 모델과 같은 프로젝트로 본다.
function collect_model_refs(node, project_name, out){
	(Array.isArray(node.models) ? node.models : []).forEach((child) => {
		if(!child || typeof child !== 'object') return;
		let child_project = child.file_path || project_name;
		if(child.file_name) out.add(child_project + '/' + child.file_name);
		collect_model_refs(child, child_project, out);
	});
}

app.post('/get_all_model_list', (req, res) => {
	// 두 테이블의 collation 이 달라 UNION 대신 쿼리를 나눠 받는다.
	let sql = "select 'a' as kind, p.project_name, m.model_id as uid, m.model_type, m.model_name, m.file_name, m.location, "
		+ "date_format(m.updated, '%Y-%m-%d %H:%i:%s') as updated "
		+ "from atomic_models m join projects p on p.pk = m.project_no; "
		+ "select 'c' as kind, p.project_name, m.model_id as uid, m.model_name, m.file_name, "
		+ "date_format(m.updated, '%Y-%m-%d %H:%i:%s') as updated, m.json_data "
		+ "from coupled_models m join projects p on p.pk = m.project_no; "
		+ "select project_name from projects order by pk";
	db.query(sql, (err, data) => {
		if(err){
			console.log(err);
			res.send({result:0, data:err});
			return;
		}
		let used_by = {};
		data[1].forEach((c) => {
			let refs = new Set();
			try { collect_model_refs(JSON.parse(c.json_data), c.project_name, refs); }
			catch(e){ console.log('get_all_model_list: bad json_data', c.project_name, c.file_name); }
			refs.delete(c.project_name + '/' + c.file_name);
			refs.forEach((key) => (used_by[key] = used_by[key] || []).push(c.project_name + '/' + c.file_name));
		});
		let models = data[0].concat(data[1]).map((m) => ({
			kind : m.kind,
			project_name : m.project_name,
			uid : m.uid,
			model_type : m.model_type === undefined ? null : m.model_type,
			builtin : m.kind === 'a' && m.model_type >= BUILTIN_MODEL_TYPE,
			model_name : m.model_name,
			file_name : m.file_name,
			location : m.location || '',
			updated : m.updated,
			used_by : used_by[m.project_name + '/' + m.file_name] || []
		}));
		models.sort((x, y) => (x.project_name + '/' + x.kind + x.file_name).localeCompare(y.project_name + '/' + y.kind + y.file_name));
		res.send({ result : 1, data : models, projects : data[2].map((p) => p.project_name) });
	});
});

// 원자모델 파일 삭제는 브라우저가 atomic_model_manager(deleteatomicmodel)에 먼저 요청한다.
// 여기서는 DB 행만 지운다. model_id + 프로젝트 + 파일명이 모두 맞는 행만 대상이다.
app.post('/delete_model_info', (req, res) => {
	let q = Object.keys(req.query).length === 0 ? req.body:req.query;
	if(typeof q.project_name !== 'string' || q.project_name == ''
		|| typeof q.file_name !== 'string' || q.file_name == ''
		|| typeof q.uid !== 'string' || q.uid == ''
		|| (q.kind !== 'a' && q.kind !== 'c')
	){
		res.send({result : "error param"});
		return;
	}
	let sql = q.kind === 'a'
		? "delete m from atomic_models m join projects p on p.pk = m.project_no "
			+ "where m.model_id = ? and p.project_name = ? and m.file_name = ? and m.model_type < " + BUILTIN_MODEL_TYPE
		: "delete m from coupled_models m join projects p on p.pk = m.project_no "
			+ "where m.model_id = ? and p.project_name = ? and m.file_name = ?";
	let params = [q.uid, q.project_name, q.file_name];
	console.log(sql, params);
	db.query(sql, params, (err, data) => {
		if(err){
			console.log(err);
			res.send({result:0, data:err});
			return;
		}
		if(q.kind === 'c' && data.affectedRows > 0){
			fs.unlink(thumbnail_path(q.project_name, q.file_name), () => {});
		}
		res.send({ result : 1, deleted : data.affectedRows });
	});
});

// ----- 모델관리 창: 패키지(프로젝트) 이름변경 / 삭제 (web_root/scripts2/atomic_manage.js) -----
// 패키지 폴더(sim_engine/projects/<패키지>)는 브라우저가 atomic_model_manager 에 먼저 요청하고
// (renameatomicproject / deleteatomicproject), 여기서는 DB 를 바꾼다.

// atomic_manager.cpp is_safe_name 과 같은 규칙 (폴더 이름으로 쓰인다)
function is_safe_project_name(name){
	return typeof name === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(name)
		&& !/^(CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])$/i.test(name);
}

// DB(collation)와 Windows 폴더 이름 모두 대소문자를 구분하지 않는다.
function same_project(a, b){
	return typeof a === 'string' && a.toLowerCase() === b.toLowerCase();
}

// 커플드 모델 json 에서 이 패키지를 가리키는 file_path 를 새 이름으로 바꾸고 바꾼 개수를 돌려준다(중첩 포함).
// file_path 가 없는 하위 모델은 상위 모델의 패키지를 따르므로 그대로 둔다(collect_model_refs 참고).
function rename_model_refs(node, old_name, new_name){
	if(!node || typeof node !== 'object') return 0;
	let count = 0;
	if(same_project(node.file_path, old_name)){
		node.file_path = new_name;
		count++;
	}
	(Array.isArray(node.models) ? node.models : []).forEach((child) => count += rename_model_refs(child, old_name, new_name));
	return count;
}

// 여러 쿼리를 한 트랜잭션으로 실행한다. work(query) 가 throw 하면 롤백한다.
function with_transaction(work, done){
	db.getConnection((err, conn) => {
		if(err) return done(err);
		let query = (sql, params) => new Promise((resolve, reject) =>
			conn.query(sql, params || [], (e, data) => e ? reject(e) : resolve(data)));
		let fail = (e) => conn.rollback(() => { conn.release(); done(e); });
		conn.beginTransaction((err) => {
			if(err){
				conn.release();
				return done(err);
			}
			work(query).then((result) => conn.commit((err) => {
				if(err) return fail(err);
				conn.release();
				done(null, result);
			})).catch(fail);
		});
	});
}

function send_transaction_result(res, err, result){
	if(!err) return res.send(Object.assign({ result : 1 }, result));
	if(err.error_code) return res.send({ result : 0, error_code : err.error_code });
	console.log(err);
	res.send({ result : 0, error_code : 'db_error', data : err });
}

// 패키지 이름 변경: projects, 원자모델 등록 정보(json_data 의 project_name/file_path),
// 모든 패키지의 커플드 모델이 이 패키지를 가리키는 하위 모델 참조를 함께 바꾼다.
// 모델 행의 수정일(updated)은 모델 내용이 바뀐 것이 아니므로 유지한다.
app.post('/rename_project', (req, res) => {
	let q = Object.keys(req.query).length === 0 ? req.body:req.query;
	if(!is_safe_project_name(q.project_name) || !is_safe_project_name(q.new_project_name)
		|| q.project_name === q.new_project_name
	){
		res.send({result : "error param"});
		return;
	}
	let old_name = q.project_name, new_name = q.new_project_name;
	with_transaction(async (query) => {
		let pks = (await query("select pk from projects where project_name = ? for update", [old_name])).map((r) => r.pk);
		let atomic = 0, coupled = 0, refs = 0;
		if(pks.length){
			// default_model_setup 이 넣는 기본 기능 모델의 패키지는 바꾸지 않는다(삭제와 같은 규칙).
			let builtin = await query("select count(*) as n from atomic_models where project_no in (?) and model_type >= " + BUILTIN_MODEL_TYPE, [pks]);
			if(builtin[0].n > 0) throw { error_code : 'builtin' };
			// 같은 이름(대소문자 무시)의 다른 패키지가 있으면 합치지 않는다.
			let clash = await query("select pk from projects where project_name = ? and pk not in (?)", [new_name, pks]);
			if(clash.length) throw { error_code : 'project_exists' };
			await query("update projects set project_name = ? where pk in (?)", [new_name, pks]);
			let rows = await query("select pk, json_data from atomic_models where project_no in (?)", [pks]);
			for(let row of rows){
				let j;
				try { j = JSON.parse(row.json_data); } catch(e){ continue; }
				if(!j || typeof j !== 'object') continue;
				let changed = false;
				['project_name', 'file_path'].forEach((key) => {
					if(same_project(j[key], old_name)){ j[key] = new_name; changed = true; }
				});
				if(!changed) continue;
				await query("update atomic_models set json_data = ?, updated = updated where pk = ?", [JSON.stringify(j), row.pk]);
				atomic++;
			}
		}
		else{
			// 서버 폴더만 있던 패키지: DB 에는 바꿀 패키지가 없지만 같은 이름의 다른 패키지와 합치지는 않는다.
			let clash = await query("select pk from projects where project_name = ?", [new_name]);
			if(clash.length) throw { error_code : 'project_exists' };
		}
		let rows = await query("select pk, json_data from coupled_models for update");
		for(let row of rows){
			let j;
			try { j = JSON.parse(row.json_data); } catch(e){ continue; }
			let count = rename_model_refs(j, old_name, new_name);
			if(!count) continue;
			await query("update coupled_models set json_data = ?, updated = updated where pk = ?", [JSON.stringify(j), row.pk]);
			coupled++;
			refs += count;
		}
		return { renamed : pks.length > 0, atomic : atomic, coupled : coupled, refs : refs };
	}, (err, result) => {
		if(!err){
			// 썸네일 폴더도 set_coupled_info 와 같은 경로 규칙으로 옮긴다(없으면 무시).
			let from = './thumbnails/' + old_name, to = './thumbnails/' + new_name;
			if(fs.existsSync(from) && !fs.existsSync(to)) fs.rename(from, to, () => {});
		}
		send_transaction_result(res, err, result);
	});
});

// 패키지 삭제: 패키지의 원자·커플드 모델 행과 패키지 행을 지운다.
// 다른 패키지의 커플드 모델이 이 패키지 모델을 쓰는지는 화면이 get_all_model_list 의 used_by 로 경고한다.
app.post('/delete_project', (req, res) => {
	let q = Object.keys(req.query).length === 0 ? req.body:req.query;
	if(!is_safe_project_name(q.project_name)){
		res.send({result : "error param"});
		return;
	}
	let name = q.project_name;
	with_transaction(async (query) => {
		let pks = (await query("select pk from projects where project_name = ? for update", [name])).map((r) => r.pk);
		// 서버 폴더만 있던 패키지는 DB 에 지울 것이 없다.
		if(!pks.length) return { deleted : false, atomic : 0, coupled : 0 };
		let builtin = await query("select count(*) as n from atomic_models where project_no in (?) and model_type >= " + BUILTIN_MODEL_TYPE, [pks]);
		if(builtin[0].n > 0) throw { error_code : 'builtin' };
		let atomic = await query("delete from atomic_models where project_no in (?)", [pks]);
		let coupled = await query("delete from coupled_models where project_no in (?)", [pks]);
		await query("delete from projects where pk in (?)", [pks]);
		return { deleted : true, atomic : atomic.affectedRows, coupled : coupled.affectedRows };
	}, (err, result) => {
		if(!err) fs.rm('./thumbnails/' + name, { recursive : true, force : true }, () => {});
		send_transaction_result(res, err, result);
	});
});