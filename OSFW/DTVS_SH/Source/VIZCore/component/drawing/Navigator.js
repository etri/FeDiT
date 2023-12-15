class Navigator {
    constructor(sketch) {
        let scope = this;
        this.Sketch = sketch;

        this.currentSrc = undefined;
        this.currentImage = undefined;
        this.Elements = new Map();
        
        function init(){
            let divCtrl = document.createElement('div');
            divCtrl.id =  "VIZWeb3D_Navigate" +"_"+sketch.ID;
            divCtrl.className = "VIZWeb3D_Navigate";

            scope.Elements.set(divCtrl.id, divCtrl);

            let divItemCtrl = document.createElement('div');
            divItemCtrl.id =  "VIZWeb3D_Navigate_Item" +"_"+sketch.ID;
            divItemCtrl.className = "VIZWeb3D_Navigate_Item";

            scope.Elements.set(divItemCtrl.id, divItemCtrl);

            // let createItem = function(name, src, alt, click){
            //     let btnImg = document.createElement('img');
            //     btnImg.id = name + "Img"+ "_"+ sketch.ID ;
            //     btnImg.src = src;
            //     btnImg.alt = alt;
            //     btnImg.addEventListener('click', click);

            //     divItemCtrl.appendChild(btnImg);
            // };

            // createItem(1, "https://media.geeksforgeeks.org/wp-content/cdn-uploads/gfg_200x200-min.png", "image-1");
            // createItem(2, "https://media.geeksforgeeks.org/wp-content/cdn-uploads/20190710102234/download3.png", "image-2");
            // createItem(3, "https://media.geeksforgeeks.org/wp-content/cdn-uploads/gfg_200x200-min.png", "image-3");

            divCtrl.appendChild(divItemCtrl);

            document.body.appendChild(divCtrl);
        }

        function createItem(name, src, alt, click){
            let divItemCtrl = scope.GetElementById("VIZWeb3D_Navigate_Item");

            let div = document.createElement('div');
            div.className = "VIZWeb3D_Navigate_Item";

            let btnImg = document.createElement('img');
            btnImg.id = name + "Img"+ "_"+ sketch.ID ;
            btnImg.src = src;
            btnImg.alt = alt;
            btnImg.addEventListener('click', click);

            let span = document.createElement('span');
            span.innerHTML  = name;

            div.appendChild(span);
            div.appendChild(btnImg);

            // divItemCtrl.appendChild(span);
            // divItemCtrl.appendChild(btnImg);
            divItemCtrl.appendChild(div);

            return btnImg;
        }

        function clearSelect(element){
            // let divItemCtrl = scope.GetElementById("VIZWeb3D_Navigate_Item");

            // if (divItemCtrl.hasChildNodes()) {
            //     let children = divItemCtrl.childNodes;
            //     for (const node of children) {
            //         node.classList.remove('VIZWeb3D_Navigate_Item_Select');
            //     }
            //   }
            element.classList.remove('VIZWeb3D_Navigate_Item_Select');
        }

        function setSelect(element){
            
            element.classList.add('VIZWeb3D_Navigate_Item_Select');
        }

        function onClick(e){
            //console.log("Click :: ",e.srcElement.id);
            //console.log("Src :: ", e.srcElement.src);
            clearSelect(scope.currentImage);
            setSelect(e.srcElement);

            //sketch._Scale = 1;
            sketch.ResetScale();
            let src = e.srcElement.src;
            scope.currentSrc = src;
            scope.currentImage = e.srcElement;
            sketch.Image.SetImage(src);
        }

        this.Init = function()
        {
            init();
        };

        this.GetElementById = function(id){
            let id_element = id + "_"+ scope.Sketch.ID;
            return scope.Elements.get(id_element);
        };

        this.Refresh = function(){
            let divItemCtrl = scope.GetElementById("VIZWeb3D_Navigate_Item");

            while (divItemCtrl.firstChild) {
                divItemCtrl.removeChild(divItemCtrl.lastChild);
            }
            
            let index = 1;
            let create = function(value, key, map)
            {
                let img = createItem(index, key, key, onClick);
                if(index === 1)
                {
                    let src = img.src;
                    scope.currentSrc = src;
                    scope.currentImage = img;
                    setSelect(img);
                }
                index++;
            }

            scope.Sketch.Images.forEach(create);
        };
    }

    
};
export default Navigator;
