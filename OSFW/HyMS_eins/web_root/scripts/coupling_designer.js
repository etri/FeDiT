// 포트 연결을 위해 드래그 중인 라인
let _enabled_line_obj = null;
// 마우스 클릭으로 선택된 라인
let _selected_line_obj = null;
// 마지막으로 클릭된 모델
let _last_selected_obj = null;
// 마지막으로 클릭된 포트
let _last_selected_port = null;

class coupling_designer{
    constructor(o){
        this.ctx = o.ctx;
        this.iid = o.iid || get_random_string();
        this.uid = o.uid || get_random_string();
        this.models = [];
        this.model_name = o.model_name || o.file_name || 'untitled';
        this.file_name = o.file_name || 'untitled.json';
        this.in_port = [];
        this.out_port = [];
        this.scale_ratio = {x:1.0, y:1.0};
        this.canvas_offset = new vector2({});
        this.hist_mouse_pos = new vector2({});
        this.cpd_pane_size = new vector2({x:screenRect.width-3, y:screenRect.height-3});
        this.position = new vector2({});
        this.is_modify = false;
        this.file_location = o.location || 'localhost';
        if(o.in_port !== undefined){
            o.in_port.forEach((v,idx) => {
                this.add_ein_port({name:v.name || v});
            });
        }
        if(o.out_port !== undefined){
            o.out_port.forEach((v,idx) => {
                this.add_eout_port({name:v.name || v})
            });
        }
    }
    save(filename){
        let json_data = new Object();
        json_data.model_name = this.model_name;
        json_data.uid = this.uid;
        json_data.iid = this.iid;

        json_data.models = [];
        this.models.forEach((v, idx) => {
            json_data.models.push(v.save());
        });
        json_data.in_port = [];
        this.in_port.forEach(v=>{
            json_data.in_port.push(v.save());
        });
        json_data.out_port = [];
        this.out_port.forEach(v=>{
            json_data.out_port.push(v.save());
        });
        
        json_data.couples = [];

        //커플링은 별도 처리
        json_data.in_port.forEach((port, port_idx)=>{
            port.line.forEach((line, line_idx)=>{
                let cpd = new Object();
                cpd.src_model_id = 'this';//line.from_obj.model_id;
                cpd.src_port_name = line.from_obj.port_name;
                if(line.to_obj.iid == this.iid){
                    cpd.dest_model_id = 'this';
                }
                else{
                    cpd.dest_model_id = line.to_obj.iid;
                }
                
                cpd.dest_port_name = line.to_obj.port_name;
                cpd.user_offset = line.user_offset;
                json_data.couples.push(cpd);
            });
            delete port.line;
        });
        json_data.out_port.forEach((port, port_idx)=>{
            delete port.line;
        });

        json_data.models.forEach((v, idx)=>{
            v.out_port.forEach((port, port_idx)=>{
                port.line.forEach((line, line_idx)=>{
                    let cpd = new Object();
                    cpd.src_model_id = line.from_obj.iid;
                    cpd.src_port_name = line.from_obj.port_name;
                    if(line.to_obj.iid == this.iid){
                        cpd.dest_model_id = 'this';
                    }
                    else{
                        cpd.dest_model_id = line.to_obj.iid;
                    }
                    cpd.dest_port_name = line.to_obj.port_name;
                    cpd.user_offset = line.user_offset;
                    cpd.user_offset = line.user_offset;
                    json_data.couples.push(cpd);
                });
                delete port.line;
            });
            v.in_port.forEach((port, port_idx)=>{
                delete port.line;
            });
            
            //delete v.out_port;
            //delete v.in_port;
        });
        
        
        if(filename !== undefined && filename != ''){
            let json = JSON.stringify(json_data, null, '\t');
            make_text_file(json, filename);
        }
            
        this.is_modify = false;
        console.log('save', json_data);
        return json_data;
    }
    add_ein_port(o){
        this.in_port.push(new base_port(Object.assign(o, {parent:this, ctx:this.ctx,
                port_type:PORT_TYPE.EX_IN_PORT, color:'rgba(128,128,128,0.5)', idx:this.in_port.length})));
        return this.in_port[this.in_port.length-1];
    }
    add_eout_port(o){
        this.out_port.push(new base_port(Object.assign(o, {parent:this, ctx:this.ctx,
            port_type:PORT_TYPE.EX_OUT_PORT, color:'rgba(128,128,128,0.5)', idx:this.out_port.length})));

            return this.out_port[this.out_port.length-1];
    }
    add_model(o){
        //console.log(JSON.stringify(o));
        if(Array.isArray(o.model_name)){
            let m = o.model_name;
            m.forEach(v =>{
                this.models.push(new atomic(Object.assign(o, {parent:this, ctx:this.ctx, width:100, height:100, idx:this.models.length, model_name:v})));
            });
            
        }
        else{
            this.models.push(new atomic(Object.assign(o, {parent:this, ctx:this.ctx, width:100, height:100, idx:this.models.length})));
        }
        return this.models[this.models.length-1];
    }
    get_model_by_id(model_id){
        let ret = null;
        this.models.forEach(v=>{
            if(v.iid == model_id){
                ret = v;
                return;
            }
        });
        return ret;
    }
    get_model_by_name(model_name){
        let ret = null;
        this.models.forEach(v=>{
            if(v.model_name == model_name){
                ret = v;
                return;
            }
        });
        return ret;
    }
    set_coupling(o){
        let from_obj = null;
        if(o.src_model_id !== undefined){
            if(o.src_model_id == 'this' || o.src_model_id == this.iid){
                this.in_port.forEach((v, idx) =>{
                    if(v.name == o.src_port_name){
                        from_obj = v;
                        return;
                    }
                });
            }
            else{
                let src = this.get_model_by_id(o.src_model_id);
                if(src != null){
                    src.out_port.forEach((v, idx) =>{
                        if(v.name == o.src_port_name){
                            from_obj = v;
                            return;
                        }
                    });
                    
                }
            }
        }
        else if(o.src_model_name !== undefined){
            if(o.src_model_name == 'this' || o.src_model_name == this.model_name){
                this.in_port.forEach((v, idx) =>{
                    if(v.name == o.src_model_port){
                        from_obj = v;
                        return;
                    }
                });
            }
            else{
                let src = this.get_model_by_name(o.src_model_name);
                if(src != null){
                    src.out_port.forEach((v, idx) =>{
                        if(v.name == o.src_model_port){
                            from_obj = v;
                            return;
                        }
                    });
                }
                if(from_obj == null){//매치되는 포트 없다면 새로 파자
                    from_obj = src.add_out_port({name:o.src_model_port});
                }
            }
        }
        if(from_obj == null){
            console.log('error : set_coupling::from_obj is null', o, this.iid);
            return;
        }

        let to_obj = null;
        if(o.dest_model_id !== undefined){
            if(o.dest_model_id == 'this' || o.dest_model_id == this.iid){
                this.out_port.forEach((v, idx) =>{
                    if(v.name == o.dest_port_name){
                        to_obj = v;
                        return;
                    }
                });
            }
            else{
                let to_obj_model = this.get_model_by_id(o.dest_model_id);
                if(to_obj_model == null){
                    console.log('error : set_coupling::to_obj_model is null', o, this.iid);
                    return;    
                }
                to_obj_model.in_port.forEach((v, idx) =>{
                    if(v.name == o.dest_port_name){
                        to_obj = v;
                        return;
                    }
                });
            }
        }
        else if(o.dest_model_name !== undefined){
            if(o.dest_model_name == 'this' || o.dest_model_name == this.model_name){
                this.out_port.forEach((v, idx) =>{
                    if(v.name == o.dest_model_port){
                        to_obj = v;
                        return;
                    }
                });
            }
            else{
                let to_obj_model = this.get_model_by_name(o.dest_model_name);
                if(to_obj_model == null){
                    console.log('error : set_coupling::to_obj_model is null', o, this.iid);
                    return;    
                }
                to_obj_model.in_port.forEach((v, idx) =>{
                    if(v.name == o.dest_model_port){
                        to_obj = v;
                        return;
                    }
                });
                if(to_obj == null){
                    to_obj = to_obj_model.add_in_port({name:o.dest_model_port});
                }
            }
        }
        if(to_obj != null){
            from_obj.load(Object.assign({to_obj:to_obj}, o));
        }
    }
    
    clear_designer(){
        this.models = [];
        this.in_port = [];
        this.out_port = [];
        _selected_line_obj = null;
        _enabled_line_obj = null;
        _last_selected_obj = null;
        _last_selected_port = null;
        this.is_modify = false;
        this.scale_ratio = {x:1.0, y:1.0};
        this.canvas_offset = new vector2({});
        this.iid = get_random_string();
        this.uid = get_random_string();
        this.cpd_pane_size = new vector2({x:screenRect.width-3, y:screenRect.height-3});

    }
    set_scale(r){
        scale_ratio = r;
    }
    delete_model(m){
        m.delete_obj();
        let midx = this.models.indexOf(m);
        if(midx > -1){
            this.models.splice(midx, 1);
        }
    }
    delete_port(p){
        p.delete_obj();
        if(p.port_type == PORT_TYPE.EX_IN_PORT){
            let midx = this.in_port.indexOf(p);
            if(midx > -1){
                this.in_port.splice(midx, 1);
            }
        }
        else if(p.port_type == PORT_TYPE.EX_OUT_PORT){
            let midx = this.out_port.indexOf(p);
            if(midx > -1){
                this.out_port.splice(midx, 1);
            }
        }
    }
    
    on_keydown(e){
        if(e.key == 'Delete'){
            if(_selected_line_obj != null){
                _selected_line_obj.from_obj.delete_line(_selected_line_obj);
                _selected_line_obj.to_obj.delete_line(_selected_line_obj);
                _selected_line_obj = null;
            }
            else if(_last_selected_obj != null){
                if(confirm('[' + _last_selected_obj.model_name+'] 을 정말 삭제하시겠습니까?')){
                    this.delete_model(_last_selected_obj);
                    _last_selected_obj = null;
                }
            }
            else if(_last_selected_port != null){
                if(confirm('[' + _last_selected_port.name+'] 을 정말 삭제하시겠습니까?')){
                    this.delete_port(_last_selected_port);
                    _last_selected_port = null;
                }
            }
        }
        
    }
    on_mousewheel(e){
        var x = e.pageX - screenRect.x;
        var y = e.pageY - screenRect.y;
        var x2 = (x - this.canvas_offset.x) * this.scale_ratio.x;
        var y2 = (y - this.canvas_offset.y) * this.scale_ratio.y;
        
        var zoom = e.wheelDelta>0?0.05:-0.05;
        this.scale_ratio.x += zoom;
        this.scale_ratio.y += zoom;
        if(this.scale_ratio.x < 0.25)
            this.scale_ratio.x = 0.25;
        else if(this.scale_ratio.x > 1.5)
            this.scale_ratio.x = 1.5;
        if(this.scale_ratio.y < 0.25)
            this.scale_ratio.y = 0.25;
        else if(this.scale_ratio.y > 1.5)
            this.scale_ratio.y = 1.5;
        var x3 = (x - this.canvas_offset.x) * this.scale_ratio.x;
        var y3 = (y - this.canvas_offset.y) * this.scale_ratio.y;
        this.canvas_offset.x -= (x3 - x2) / this.scale_ratio.x;
        this.canvas_offset.y -= (y3 - y2) / this.scale_ratio.y;
    }
    on_mousedbclick(e){
        var x = e.pageX - screenRect.x;
        var y = e.pageY - screenRect.y;
        var ret = false;
        x -= this.canvas_offset.x;
        y -= this.canvas_offset.y;
        x /= this.scale_ratio.x;
        y /= this.scale_ratio.y;

        for(var i=0;i<this.models.length;i++){
            if(this.models[i].on_mousedbclick(x, y) == 1){
                ret = true;
                break;
            }
        }
    }
    on_mousedown(e){
        var x = e.pageX - screenRect.x;
        var y = e.pageY - screenRect.y;
        this.hist_mouse_pos.x = x;
        this.hist_mouse_pos.y = y;
        var ret = false;
        
        x -= this.canvas_offset.x;
        y -= this.canvas_offset.y;
        x /= this.scale_ratio.x;
        y /= this.scale_ratio.y;
        
        if(e.buttons == 1 || e.button == 2){
            // 마우스 클릭으로 선택된 라인
            if(_selected_line_obj != null){
                if(_selected_line_obj.on_mousedown(x, y) == 1){
                    ret = true;
                    return true;
                }
            }
            // 마지막으로 클릭된 모델
            if(_last_selected_obj != null){
                if(_last_selected_obj.on_mousedown(x, y) == 1){
                    ret = true;
                    return true;
                }
            }

            for(var i=0;i<this.models.length;i++){
                if(this.models[i].on_mousedown(x, y) == 1){
                    ret = true;
                    set_param_to_form(this.models[i]);
                    break;
                }
            }
            for(var i=0;i<this.in_port.length;i++){
                if(this.in_port[i].on_mousedown(x, y) == 1){
                    ret = true;
                    _last_selected_port = this.in_port[i];
                    break;
                }
            }
            for(var i=0;i<this.out_port.length;i++){
                if(this.out_port[i].on_mousedown(x, y) == 1){
                    ret = true;
                    _last_selected_port = this.out_port[i];
                    break;
                }
            }
            if(!ret){
                set_param_to_form(null);
                _enabled_line_obj = null;
                _selected_line_obj = null;
                _last_selected_obj = null;
                _last_selected_port = null;
            }
        }
        return ret;
    }
    on_mousemove(e){
        var x = e.pageX - screenRect.x;
        var y = e.pageY - screenRect.y;
        var dx = x - this.hist_mouse_pos.x;
        var dy = y - this.hist_mouse_pos.y;
        this.hist_mouse_pos.x = x;
        this.hist_mouse_pos.y = y;
        
        if(e.buttons == 0 || e.buttons == 1){
            x -= this.canvas_offset.x;
            y -= this.canvas_offset.y;
            x /= this.scale_ratio.x;
            y /= this.scale_ratio.y;
            this.models.forEach(m => {
                m.on_mousemove(x, y, dx, dy);
            });
            this.in_port.forEach(v => v.on_mousemove(x, y, dx, dy));
            this.out_port.forEach(v => v.on_mousemove(x, y, dx, dy));

        }
        else if(e.buttons == 4){//scroll
            this.canvas_offset.x += dx;
            this.canvas_offset.y += dy;
        }
    }
    on_mouseup(e){
        var x = e.pageX - screenRect.x;
        var y = e.pageY - screenRect.y;
        
        
        x -= this.canvas_offset.x;
        y -= this.canvas_offset.y;
        x /= this.scale_ratio.x;
        y /= this.scale_ratio.y;
        this.models.forEach(m => {
            m.on_mouseup(x, y);
        });
        this.in_port.forEach(v => v.on_mouseup(x, y));
        this.out_port.forEach(v => v.on_mouseup(x, y));
    }
    on_mouseout(e){
        this.models.forEach(m => {
            m.on_mouseup(0, 0);
        });
        this.in_port.forEach(v => v.on_mouseup(0, 0));
        this.out_port.forEach(v => v.on_mouseup(0, 0));
    }
    draw(){
        this.ctx.save();
        this.ctx.translate(this.canvas_offset.x, this.canvas_offset.y);
        this.ctx.scale(this.scale_ratio.x, this.scale_ratio.y);
        let port_y = this.draw_bg();
        this.models.forEach(m => {
            m.draw();
        });
        this.ctx.font = '10pt arial';
        this.ctx.textAlign='left';
        this.ctx.textBaseline = 'middle';
        for(var i=0;i<this.in_port.length;i++){
            this.in_port[i].draw(0, port_y + PORT_ARROW_HEIGHT + i * PORT_ARROW_HEIGHT * 2);
        }

        for(var i=0;i<this.out_port.length;i++){
            this.out_port[i].draw(this.cpd_pane_size.x - PORT_ARROW_WIDTH, port_y + PORT_ARROW_HEIGHT + i * PORT_ARROW_HEIGHT * 2);
        }
        this.ctx.restore();
    }
    draw_bg(){
        this.ctx.fillStyle = 'rgba(255,255,255,1)';
        this.ctx.strokeStyle = 'black';
        this.ctx.fillRect(0, 0, this.cpd_pane_size.x, this.cpd_pane_size.y);
        this.ctx.beginPath();
        this.ctx.rect(0, 0, this.cpd_pane_size.x, this.cpd_pane_size.y);
        this.ctx.stroke();
        return 10;
    }

    adjust_pane(auto_size=false){
        let r = 1;
        let b = 1;
        cpd_designer.models.forEach(v => {
            if(v.position.x + v.width + 150 > r){
                r = v.position.x + v.width + 150;
            }
            if(v.position.y + v.height + 50 > b){
                b = v.position.y + v.height + 50;
            }
        });
        screenRect = canvas.getBoundingClientRect();
        canvas.width = screenRect.width;
        canvas.height = screenRect.height;
        if(this.models !== undefined && this.models.length == 0){
            r = canvas.width;
            b = canvas.height;
        }
        cpd_designer.cpd_pane_size.x = r;
        cpd_designer.cpd_pane_size.y = b;
        if(auto_size){
            cpd_designer.canvas_offset.x = 0;
            cpd_designer.canvas_offset.y = 0;
            let new_ratio = {x:(screenRect.width-3) / cpd_designer.cpd_pane_size.x, y:(screenRect.height-3) / cpd_designer.cpd_pane_size.y};
            if(new_ratio.x < new_ratio.y)
                new_ratio.y = new_ratio.x;
            else
                new_ratio.x = new_ratio.y;
            cpd_designer.scale_ratio = new_ratio;
        }
    }
}//end of class coupling_designer