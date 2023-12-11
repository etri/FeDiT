class base_port{
    constructor(o){
        this.parent = o.parent;
        this.ctx = o.ctx;
        this.id = o.id || get_random_string();
        this.index = o.idx;
        this.width = PORT_ARROW_WIDTH;
        this.height = PORT_ARROW_HEIGHT;
        
        this.selected = false;
        this.name = o.name;
        this.position = new vector2({});
        this.is_mouseon = 0;  
        this.port_type = o.port_type; 
        this.line = [];
        if(this.port_type == PORT_TYPE.EX_IN_PORT || this.port_type == PORT_TYPE.OUT_PORT)
            this.color = get_random_color();//o.color || 'rgba(255,128,128,1)';
        else
            this.color = 'white';
    }
    save(){
        let d = new Object();
        d.index = this.index;
        d.name = this.name;
        d.line = [];
        this.line.forEach(v =>{
            d.line.push(v.save());
        });
        return d;
    }
    load(o){
        var line = new base_line({parent:this, ctx:this.ctx});
        if(o.user_offset !== undefined)
            line.user_offset = o.user_offset;
        line.to_obj = o.to_obj;
        this.line.push(line);
        line.to_obj.line.push(line);
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
    on_mousedown(x, y){
        var ret = 0;
        
        if(this.chk_mousepos(x, y)){
            this.selected = true;
            _enabled_line_obj = new base_line({parent:this, ctx:this.ctx});
            this.line.push(_enabled_line_obj);
            ret = 1;
        }
        else if(this.line.length != 0){
            this.line.forEach((v)=>{
                if(v.on_mousedown(x, y) == 1){
                    ret = 1;
                    return;
                }
            });
        }
        return ret;
    }
    on_mousemove(x, y, dx, dy){
        if(this.selected){
            _enabled_line_obj.on_mousemove(x, y, dx, dy);
        }
        else if(this.chk_mousepos(x, y)){
            if(_enabled_line_obj != null){
                if(this.port_type == PORT_TYPE.OUT_PORT || this.port_type == PORT_TYPE.EX_IN_PORT){
                    this.is_mouseon = 2;
                }
                else{
                    _enabled_line_obj.to_obj = this;
                    this.is_mouseon = 1;
                }
            }
            else if(this.port_type == PORT_TYPE.OUT_PORT || this.port_type == PORT_TYPE.EX_IN_PORT){
                this.is_mouseon = 1;
            }
        }
        else{
            if(_enabled_line_obj != null && _enabled_line_obj.to_obj == this)
                _enabled_line_obj.to_obj = null;
            this.is_mouseon = 0;
            if(this.line.length != 0 && (this.port_type == PORT_TYPE.OUT_PORT || this.port_type == PORT_TYPE.EX_IN_PORT))
                this.line.forEach(v => v.on_mousemove(x, y, dx, dy));
        }
    }
    on_mouseup(x, y){
        if(this.selected){
            if(_enabled_line_obj.on_mouseup(x, y) == 0){
                if(_enabled_line_obj.to_obj == null){
                    delete this.line[this.line.length-1];
                    this.line.pop();
                }
                else{
                    if(this.port_type == PORT_TYPE.EX_IN_PORT || this.port_type == PORT_TYPE.EX_OUT_PORT)
                        this.parent.is_modify = true;
                    else
                        this.parent.parent.is_modify = true;
                    let is_dup = false;
                    _enabled_line_obj.to_obj.line.forEach(v=>{
                        // 중복검사
                        if(v.from_obj == this){
                            is_dup = true;
                            console.log('중복');
                            return;
                        }
                    });
                    if(!is_dup){
                        _enabled_line_obj.to_obj.line.push(_enabled_line_obj);
                        if(this.port_type == PORT_TYPE.EX_IN_PORT){
                            this.name = _enabled_line_obj.to_obj.name;
                        }
                        else if(_enabled_line_obj.to_obj.port_type == PORT_TYPE.EX_OUT_PORT){
                            _enabled_line_obj.to_obj.name = this.name;
                        }
                    }
                    else{
                        delete this.line[this.line.length-1];
                        this.line.pop();
                    }
                }
                _enabled_line_obj = null;
            }
            this.selected = false;
        }
        if(this.port_type == PORT_TYPE.OUT_PORT || this.port_type == PORT_TYPE.EX_IN_PORT){
            this.line.forEach(v=>v.on_mouseup(x, y));
        }
    }
    delete_obj(){
        this.line.forEach(v=>{
            if(this.port_type == PORT_TYPE.OUT_PORT || this.port_type == PORT_TYPE.EX_IN_PORT){
                v.to_obj.delete_line(v);
            }
            else{
                v.from_obj.delete_line(v);
            }
        });
    }
    delete_line(line){
        let idx = this.line.indexOf(line);
        if(idx > -1){
            this.line.splice(idx, 1);
            if(this.parent.parent != null)
                this.parent.parent.is_modify = true;
        }
    }
    draw(x, y){
        switch(this.port_type){
            case PORT_TYPE.IN_PORT:
                this.draw_in(x, y);break;
            case PORT_TYPE.OUT_PORT:
                this.draw_out(x, y);break;
            case PORT_TYPE.EX_IN_PORT:
                this.draw_exin(x, y);break;
            case PORT_TYPE.EX_OUT_PORT:
                this.draw_exout(x, y);break;
        }
    }
    
    draw_exin(x, y){
        if(this.line.length != 0)
            this.line.forEach(v => v.draw());
        this.ctx.save();
        this.position.x = x;
        this.position.y = y;
        this.ctx.translate(x, y);
        if(this.is_mouseon == 1 || this.selected || this.line.length > 0){
            if(this.line.length > 0){
                this.ctx.fillStyle = this.line[0].from_obj.color;
            }
            else
                this.ctx.fillStyle = this.color;
        }
        else if(this.is_mouseon == 2){
            this.ctx.fillStyle='rgba(255,0,0,1)';
        }
        else
            this.ctx.fillStyle='white';

        this.ctx.fill(arrow_obj);
        this.ctx.stroke(arrow_obj);
        this.ctx.translate(0, -PORT_ARROW_HEIGHT);
        this.ctx.fillStyle = 'rgba(47, 155, 71, 1)';
        this.ctx.fillText(this.name, 5, PORT_ARROW_HEIGHT * 0.5);
        this.ctx.restore();
        
    }
    draw_in(x, y){
        this.ctx.save();
        this.position.x = x;
        this.position.y = y;
        this.ctx.translate(x, y);
        if(this.is_mouseon == 1 || this.selected || this.line.length > 0){
            if(this.line.length > 0){
                this.ctx.fillStyle = this.line[0].from_obj.color;
            }
            else
                this.ctx.fillStyle = this.color;
        }
        else if(this.is_mouseon == 2){
            this.ctx.fillStyle='rgba(255,0,0,1)';
        }
        else
            this.ctx.fillStyle='white';

        this.ctx.fill(arrow_obj);
        this.ctx.stroke(arrow_obj);
        this.ctx.fillStyle = 'rgba(47, 155, 71, 1)';
        this.ctx.fillText(this.name, PORT_ARROW_WIDTH + 5, PORT_ARROW_HEIGHT * 0.5);
        this.ctx.restore();
    }
    draw_exout(x, y){
        this.ctx.save();
        this.position.x = x;
        this.position.y = y;
        this.ctx.translate(x, y);
        this.ctx.textAlign='right';
        if(this.is_mouseon == 1 || this.selected || this.line.length > 0){
            if(this.line.length > 0){
                this.ctx.fillStyle = this.line[0].from_obj.color;
            }
            else
                this.ctx.fillStyle = this.color;
        }
        else if(this.is_mouseon == 2){
            this.ctx.fillStyle='rgba(255,0,0,1)';
        }
        else
            this.ctx.fillStyle='white';
        this.ctx.fill(arrow_obj);
        this.ctx.stroke(arrow_obj);
        this.ctx.translate(0, -PORT_ARROW_HEIGHT);
        this.ctx.fillStyle = 'rgba(65,55,147,1)';
        this.ctx.fillText(this.name, 5, PORT_ARROW_HEIGHT * 0.5);
        this.ctx.restore();
        
    }
    draw_out(x, y){
        this.ctx.save();
        this.position.x = x;
        this.position.y = y;
        this.ctx.translate(x, y);
        this.ctx.textAlign='right';
        if(this.is_mouseon == 1 || this.selected || this.line.length != 0){
            this.ctx.fillStyle = this.color;
        }
        else if(this.is_mouseon == 2){
            this.ctx.fillStyle='rgba(255,0,0,1)';
        }
        else{
            this.ctx.fillStyle = 'white';
        }
        this.ctx.fill(arrow_obj);
        this.ctx.stroke(arrow_obj);
        this.ctx.fillStyle = 'rgba(65,55,147,1)';
        this.ctx.fillText(this.name, -5, PORT_ARROW_HEIGHT * 0.5);
        this.ctx.restore();
        if(this.line.length != 0)
            this.line.forEach(v => v.draw());
    }
} // end of class base_port