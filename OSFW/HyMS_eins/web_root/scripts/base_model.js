const PORT_ARROW_WIDTH = 10;
const PORT_ARROW_HEIGHT = 20;
const MODEL_TYPE = {
    UNKNOWN : 0,
    DISCRETE : 1,
    CONTINUOUS : 2,
    FUNCTION : 3,
    ATOMIC : 11,
    COUPLED : 99,
    EMBEDED_FUNC : 10000,
    EMBEDED_FUNC_PRINT : 10001,
    EMBEDED_FUNC_GRAPH_2D : 10002,
    EMBEDED_FUNC_PLUS : 10003,
    EMBEDED_FUNC_MINUS : 10004,
    EMBEDED_FUNC_MUL : 10005,
    EMBEDED_FUNC_DIV : 10006,
};
const PORT_TYPE = {
    IN_PORT : 1,
    OUT_PORT : 2,
    EX_IN_PORT : 3,
    EX_OUT_PORT : 4,        
};
const DRAW_DIR = {
    NONE : 0,
    UP : 1,
    RIGHT : 2,
    DOWN : 3,
    LEFT : 4
};

class base_model{
    constructor(o){
        this.parent = o.parent;
        this.ctx = o.ctx;
        this.in_port = [];
        this.out_port = [];
        this.idx = o.idx || -1;
        this.ext_window = null;
        this.load(o);
    }

    load(o){
        console.log(o);
        this.iid = o.iid || get_random_string();
        this.uid = o.uid || get_random_string();
        this.font_title = 'bold 11pt arial';
        this.font_port = '10pt arial';
        this.file_name = o.file_name || 'untitled.json';
        let ext = this.file_name.substring(this.file_name.lastIndexOf('.')+1).toLowerCase();
        if(o.model_type === undefined && ext == 'json'){
            o.model_type = MODEL_TYPE.COUPLED;
        }
        else if(o.model_type === undefined){
            if(ext == 'dll' || ext == 'py' || ext == 'm'){
                o.model_type = MODEL_TYPE.DISCRETE;
            }
        }
        this.model_type = o.model_type || MODEL_TYPE.COUPLED;
        if(this.model_type == 4)
            this.model_type = MODEL_TYPE.EMBEDED_FUNC_PRINT;
        this.file_path = o.file_path || project_name;
        if(o.ip !== undefined){
            o.ip_port = o.ip + ':' + o.port;
        }
        this.ip_port = o.ip_port || 'localhost:8865';
        this.model_name = o.model_name || 'untitled';
        this.ctx.font = this.font_title;
        this.fontmetrics = this.ctx.measureText(this.model_name);
        this.fontHeight = this.fontmetrics.fontBoundingBoxAscent + this.fontmetrics.fontBoundingBoxDescent;
        if(o.position !== undefined){
            if(o.position.x < 150)
                o.position.x = 150;
            if(o.position.y < 50)
                o.position.y = 50;
            this.position = new vector2({x:o.position.x, y:o.position.y});
        }
        else
            this.position = new vector2({x:150, y:50});
        this.color = o.color || get_random_color();
        let port_name_max_length = 0;
        let port_name_max_length_str = '';
        if(o.in_port !== undefined){
            
            o.in_port.forEach((v, idx) => {
                this.add_in_port(v, false);
                let port_name = v.name || v;
                if(port_name_max_length < port_name.length){
                    port_name_max_length = port_name.length;
                    port_name_max_length_str = port_name;
                }
            });
        }
        else{
            this.in_port = [];
        }
        if(o.out_port !== undefined){
            o.out_port.forEach((v, idx) => {
                this.add_out_port(v, false);
                let port_name = v.name || v;
                if(port_name_max_length < port_name.length){
                    port_name_max_length = port_name.length;
                    port_name_max_length_str = port_name;
                }
            });
        }
        else{
            this.out_port = [];
        }
        if(o.in_param !== undefined){
            this.in_param = o.in_param;
        }
        else{
            this.in_param = [];
        }
        this.selected = false;
        this.selected_pos = new vector2({});
        
        this.ctx.font = this.font_port;
        var fm = this.ctx.measureText(port_name_max_length_str);
        this.width = fm.width + PORT_ARROW_WIDTH * 4;
        
        if((this.fontmetrics.width + PORT_ARROW_WIDTH * 2) > this.width)
            this.width = this.fontmetrics.width + PORT_ARROW_WIDTH * 2;
        //this.model_name_lines = wrap_text(this.model_name, this.width - 10, this.ctx);
        let min_height = this.fontHeight * 1.5;//(this.model_name_lines.length + 0.5);
        if(this.in_port.length > 0 || this.out_port.length > 0)
            min_height += ((this.in_port.length > this.out_port.length? this.in_port.length * (PORT_ARROW_HEIGHT * 2):this.out_port.length * (PORT_ARROW_HEIGHT*2) + PORT_ARROW_HEIGHT));
        this.height = min_height;
        
        if(this.width < 100)
            this.width = 100;
        if(this.height < 100)
            this.height = 100;

        if(this.model_type == MODEL_TYPE.EMBEDED_FUNC_PRINT){
            add_print_window(this.iid);
        }
        else if(this.model_type == MODEL_TYPE.EMBEDED_FUNC_GRAPH_2D){
            add_graph2d_window(this.iid);
        }
    }
    add_in_port(o, update_size = true){
        let p = new base_port(Object.assign({parent:this,
            ctx:this.ctx, 
            port_type:PORT_TYPE.IN_PORT,
            color:this.color, idx:this.in_port.length}, o));
        this.in_port.push(p);
        if(update_size){
            let port_name = o.name || o;
            this.ctx.font = this.font_port;
            var fm = this.ctx.measureText(port_name);
            if(this.width < fm.width + PORT_ARROW_WIDTH * 4)
                this.width = fm.width + PORT_ARROW_WIDTH * 4;
            let min_height = this.fontHeight * 1.5;//(this.model_name_lines.length + 0.5);
            if(this.in_port.length > 0 || this.out_port.length > 0)
                min_height += ((this.in_port.length > this.out_port.length? this.in_port.length * (PORT_ARROW_HEIGHT * 2):this.out_port.length * (PORT_ARROW_HEIGHT*2) + PORT_ARROW_HEIGHT));
            this.height = min_height;
        }
        return p;
    }
    add_out_port(o, update_size = true){
        let p = new base_port(Object.assign({parent:this,
            ctx:this.ctx, 
            port_type:PORT_TYPE.OUT_PORT,
            color:this.color, idx:this.out_port.length}, o));
        this.out_port.push(p);
        if(update_size){
            let port_name = o.name || o;
            this.ctx.font = this.font_port;
            var fm = this.ctx.measureText(port_name);
            if(this.width < fm.width + PORT_ARROW_WIDTH * 4)
                this.width = fm.width + PORT_ARROW_WIDTH * 4;
            let min_height = this.fontHeight * 1.5;//(this.model_name_lines.length + 0.5);
            if(this.in_port.length > 0 || this.out_port.length > 0)
                min_height += ((this.in_port.length > this.out_port.length? this.in_port.length * (PORT_ARROW_HEIGHT * 2):this.out_port.length * (PORT_ARROW_HEIGHT*2) + PORT_ARROW_HEIGHT));
            this.height = min_height;
        }
        return p;
    }
    save(){
        let d = new Object();
        d.model_name = this.model_name;
        d.iid = this.iid;
        d.uid = this.uid;
        d.idx = this.idx;
        d.model_type = this.model_type;
        d.file_name = this.file_name;
        d.file_path = this.file_path;
        d.ip_port = this.ip_port;
        //d.in_port = this.in_port;
        //d.out_port = this.out_port;
        d.position = this.position;
        d.color = this.color;
        d.in_port=[];
        this.in_port.forEach(v=>{
            d.in_port.push(v.save());
        });
        d.out_port=[];
        this.out_port.forEach(v=>{
            d.out_port.push(v.save());
        });
        d.in_param=this.in_param;

        return d;
    }
    on_init_from_sim_server(json_msg){
        if(this.model_type < MODEL_TYPE.EMBEDED_FUNC){
            return;
        }
        if(this.model_type == MODEL_TYPE.EMBEDED_FUNC_PRINT){
            if(this.ext_window == null){
                this.ext_window = document.getElementById(this.iid + '_div_content');
            }
            this.ext_window.innerHTML = '';
            this.ext_window.scrollTop = this.ext_window.scrollHeight;
        }
        else if(this.model_type == MODEL_TYPE.EMBEDED_FUNC_GRAPH_2D){
            graph_clear(this.iid);
        }
    }
    on_message_from_sim_server(json_msg){
        if(this.model_type < MODEL_TYPE.EMBEDED_FUNC){
            return;
        }
        if(this.model_type == MODEL_TYPE.EMBEDED_FUNC_PRINT){
            if(this.ext_window == null){
                this.ext_window = document.getElementById(this.iid + '_div_content');
            }
            this.ext_window.innerHTML += json_msg.sim_time.toFixed(2) + '][' + json_msg.src_port_name
                + '] ' + json_msg.value + '<br>';
            this.ext_window.scrollTop = this.ext_window.scrollHeight;
        }
        else if(this.model_type == MODEL_TYPE.EMBEDED_FUNC_GRAPH_2D){
            graph_add_data(this.iid, json_msg.src_port_name,
                 Math.round(json_msg.sim_time*1e3)/1e3, json_msg.value);
        }
    }
    chk_mousepos(x, y){
        if ((x >= (this.position.x)) && 
            (x <= (this.position.x + this.width)) && 
            (y >= (this.position.y)) && 
            (y <= (this.position.y + this.height))) {
            return true;
        }

        return false;
    }
    on_mousedbclick(x, y){
        if(this.chk_mousepos(x, y)){
            if(this.model_type == MODEL_TYPE.COUPLED){
                console.log('cpd', this.model_name, this.file_name);
                save_to_stack();
                setTimeout(load_from_api_server, 100, project_name, this.file_name, this.uid);
            }
            else{
                console.log(this.model_name, this.file_name);
                if(this.model_type == MODEL_TYPE.EMBEDED_FUNC_PRINT){
                    let d = document.getElementById(this.iid + '_div');
                    d.style.display='';
                    d.style.left = event.clientX;
                    d.style.top = event.clientY;
                    if(this.ext_window == null){
                        this.ext_window = document.getElementById(this.iid + '_div_content');
                    }
                    this.ext_window.scrollTop = this.ext_window.scrollHeight;
                }
                else if(this.model_type == MODEL_TYPE.EMBEDED_FUNC_GRAPH_2D){
                    let d = document.getElementById(this.iid + '_div');
                    d.style.display='';
                    d.style.left = event.clientX;
                    d.style.top = event.clientY;
                    line_graph[this.iid+'_div_graph'].update();
                }
            }
            return 1;
        }
        return 0;
    }
    on_mousedown(x, y){
        for(var i=0;i<this.out_port.length;i++){
            if(this.out_port[i].on_mousedown(x, y) == 1){
                return 1;
            }
        }

        if(this.chk_mousepos(x, y)){
            this.selected = true;
            this.selected_pos.x = x - this.position.x;
            this.selected_pos.y = y - this.position.y;
            _last_selected_obj = this;
            
            return 1;
        }
        return 0;
    }
    on_mousemove(x, y, dx, dy){
        if(this.selected){
            var new_x = x - this.selected_pos.x;
            var new_y = y - this.selected_pos.y;
            if(new_x >= 150)
                this.position.x = new_x;
            if(new_y >= 50)
                this.position.y = new_y;
            this.parent.is_modify = true;
        }
        else{
            this.in_port.forEach(v => v.on_mousemove(x, y, dx, dy));
            this.out_port.forEach(v => v.on_mousemove(x, y, dx, dy));
        }
    }
    on_mouseup(x, y){
        if(this.selected){
            this.selected = false;
            this.parent.adjust_pane();
        }
        else{
            this.in_port.forEach(v => v.on_mouseup(x, y));
            this.out_port.forEach(v => v.on_mouseup(x, y));
        }
    }
    delete_obj(){
        this.in_port.forEach(v=>{
            v.delete_obj();
        });
        this.out_port.forEach(v=>{
            v.delete_obj();
        });
    }
    draw_bg(){
        this.ctx.save();
        this.ctx.font
        this.ctx.font = this.font_title;
        this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
        this.ctx.strokeStyle = 'black';
        this.ctx.beginPath();
        this.ctx.roundRect(this.position.x, this.position.y, this.width, this.height, [5, 5, 0, 0]);//잴 외곽
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.roundRect(this.position.x, this.position.y, this.width, this.fontHeight * 1.5, [5, 5, 0, 0]);//(this.model_name_lines.length + 1));//제목 외곽
        if(this.model_type >= MODEL_TYPE.EMBEDED_FUNC){
            this.ctx.fillStyle = 'rgba(0,0,255,0.2)';
        }
        else if(this.in_param.length > 0){
            this.ctx.fillStyle = 'rgba(255,0,0,0.2)';
        }
        else{
            this.ctx.fillStyle = 'rgba(0,255,0,0.2)';
        }
        
        this.ctx.fill();
        this.ctx.textBaseline = 'top';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = 'rgba(0,0,0,1)';
        this.ctx.fillText(this.model_name, this.position.x + this.width * 0.5, this.position.y + this.fontHeight * 0.25);
        this.ctx.restore();
        return this.fontHeight * 1.5;//(this.model_name_lines.length + 1);
    }
    draw(){
        this.ctx.save();
        var port_y = this.draw_bg();
        this.ctx.font = this.font_port;
        this.ctx.textAlign='left';
        this.ctx.textBaseline = 'middle';
        for(var i=0;i<this.in_port.length;i++){
            this.in_port[i].draw(this.position.x, port_y + this.position.y + i * PORT_ARROW_HEIGHT * 2);
        }

        for(var i=0;i<this.out_port.length;i++){
            this.out_port[i].draw(this.position.x + this.width, port_y + PORT_ARROW_HEIGHT + this.position.y + i * PORT_ARROW_HEIGHT * 2);
        }
        this.ctx.restore();
    }

} //end of class base_model