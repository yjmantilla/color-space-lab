let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');
inputElement.addEventListener('change', (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);
var STATE = {'framedata':[],'orgdata':[]}
var cfg = {'channel':'ALL','frame':'RGB',

get_color:function(){                                   // Función que mapea colores a indices de un arreglo de color
    if(this.color=='R'){
        return 0;                                       // R:0
    }
    else if(this.color=='G'){
        return 1;                                       // G:1
    }
    else if(this.color=='B')
    {
        return 2;                                       // B:2
    }
}
}


//https://rodrigoberriel.com/2014/11/opencv-color-spaces-splitting-channels/#:~:text=The%20Lab%20ranges%20are%3A,(1%20%3E%20L%20%3E%20255)
SPACES_RANGES={
    'HSV':{
        0:[0,180],
        1:[0,255],
        2:[0,255],
    },
    'RGB':{
        0:[0,255],
        1:[0,255],
        2:[0,255]
        },
    'LAB':{
        0:[1,255],
        1:[1,255],
        2:[1,255],
        },
    'GRAY':{
        0:[0,255],
    }
}
CHAN_TO_IDX={
    'HSV':{
        'Hue':0,
        'Saturation':1,
        'Value':2,
    },
    'RGB':{
        'Red':0,
        'Green':1,
        'Blue':2
        },
    'LAB':{
        'Luminance':0,
        'a':1,
        'b':2,
        },
    'GRAY':{
        'Value':0,
    }
}

IDX_TO_CHAN={}
for (const [space, channels] of Object.entries(CHAN_TO_IDX)) {
    IDX_TO_CHAN[space]={}
    for (const [chan, idx] of Object.entries(channels)){
        IDX_TO_CHAN[space][idx]=chan
    }
}

//cfgFolder.onChange(process_frame)

function onGuiChange(x){
    //https://stackoverflow.com/questions/16166440/refresh-dat-gui-with-new-values

    for (var i in gui.__controllers) {
        gui.__controllers[i].onChange(x)//updateDisplay();
    }

    for (var i = 0; i < Object.keys(gui.__folders).length; i++) {
        var key = Object.keys(gui.__folders)[i];
        for (var j = 0; j < gui.__folders[key].__controllers.length; j++ )
        {
            gui.__folders[key].__controllers[j].onChange(x)//updateDisplay();
        }
    }
}



function get_colorspace(STATE){
    var frame = STATE['orgdata']
        // let frame = new cv.Mat(frame.matSize[0], frame.matSize[1], cv.CV_8UC4);          // Reserva de una matriz frame que es la captura de la imagen de un video en un tiempo especifico
    // RGBA: 4 canales de unsigned integer 8
    let dummyFrame = new cv.Mat(frame.matSize[0], frame.matSize[1], cv.CV_8UC4);     // Reserva de la matriz auxiliar que irá guardando la imagen actual en cada momento
    var RGB = new cv.Mat(frame.matSize[0], frame.matSize[1], cv.CV_8UC4);      // Reserva de una matriz que guardara unicamente la capa de color indicada por el usuario
    var out_frame = new cv.Mat(frame.matSize[0], frame.matSize[1], cv.CV_8UC4);      // Reserva de una matriz que almacenará el fondo del campo proyectado en el juego
    
    //do Processing here
    //cv.flip(frame, frame, 1);
    cv.cvtColor(frame, RGB, cv.COLOR_RGBA2RGB);      // Conversión de RHBA a RGB

    if (cfg.frame=='RGB'){                                      // Verificar si el usuario marcó "gray" para el fondo
        out_frame = RGB

    }

    if (cfg.frame=='GRAY'){                                      // Verificar si el usuario marcó "gray" para el fondo
        cv.cvtColor(frame, out_frame, cv.COLOR_RGB2GRAY);      // Conversión de RGB a Escala de Grises

    }

    if (cfg.frame=='HSV'){                                      // Verificar si el usuario marcó "gray" para el fondo
        cv.cvtColor(frame, out_frame, cv.COLOR_RGB2HSV);      // Conversión de RHBA a RGB

    }

    if (cfg.frame=='LAB'){                                      // Verificar si el usuario marcó "gray" para el fondo
        cv.cvtColor(frame, out_frame, cv.COLOR_RGB2Lab);      // Conversión de RHBA a RGB

    }

    cv.imshow('canvasOutput', out_frame);

    STATE['framedata']=out_frame.clone()

    // gui.remove(STATE['channel_controller'])
    // channels = ['ALL']
    // for (const [key, value] of Object.entries(SPACES_RANGES[cfg.frame])) {
    //     let chan_name = IDX_TO_CHAN[cfg.frame][parseInt(key)]
    //     channels.push(chan_name)
    // }

    // STATE['channel_controller']=gui.add(cfg,'channel',channels)

    gui.removeFolder(STATE['thr_folder'])
    STATE['thr_folder'] = gui.addFolder('Thresholding')
        
    STATE['thresholds']={}
    for (const [key, value] of Object.entries(SPACES_RANGES[cfg.frame])) {
        let chan_name = IDX_TO_CHAN[cfg.frame][parseInt(key)]
        STATE['thresholds']['+Ch'+key]=value[1]/2
        STATE['thresholds']['-Ch'+key]=value[0]
        STATE['thr_folder'].add(STATE['thresholds'], '+Ch'+key, value[0], value[1]).name('+'+chan_name).step(1)
        STATE['thr_folder'].add(STATE['thresholds'], '-Ch'+key, value[0], value[1]).name('-'+chan_name).step(1)
    }

    function threshdraw(){
        low=[STATE['thresholds']['-Ch0'],STATE['thresholds']['-Ch1'],STATE['thresholds']['-Ch2'],0]
        high=[STATE['thresholds']['+Ch0'],STATE['thresholds']['+Ch1'],STATE['thresholds']['+Ch2'],255]    
        let dst = new cv.Mat();
        let lows =  new cv.Mat(STATE['framedata'].rows, STATE['framedata'].cols, STATE['framedata'].type(), low);
        let highs = new cv.Mat(STATE['framedata'].rows, STATE['framedata'].cols, STATE['framedata'].type(), high);
        cv.inRange(STATE['framedata'], lows,highs, dst);
        cv.imshow('threshold', dst);
    }




    for (var j = 0; j < STATE['thr_folder'].__controllers.length; j++ )
    {
        STATE['thr_folder'].__controllers[j].onChange(threshdraw)//updateDisplay();
    }
    threshdraw()


    channelCanvas =['channel1','channel2','channel3']
    for (const [key, value] of Object.entries(SPACES_RANGES[cfg.frame])) {
        the_color = new cv.Mat(frame.matSize[0], frame.matSize[1], cv.CV_8UC4);      // Reserva de una matriz que guardara unicamente la capa de color indicada por el usuario
        colorPlanes = new cv.MatVector();                                     // Reserva de un vector que guardara las capas de color de la imagen RGB por separado    
        curr_idx = parseInt(key)
        cv.split(out_frame, colorPlanes);                        // Separar la imagen RGB en los 3 canales
        the_color = colorPlanes.get(curr_idx);             // Obtener la capa marcada por el usuario en las opciones
        let idxs = Array.from({length: colorPlanes.size()}, (x, i) => i);                                 // Indices de los colores
        idxs.splice(curr_idx,1);                     // Quitamos el indice correspondiente al color que el usuario escogió
        the_color.convertTo(dummyFrame, cv.CV_8UC1, 0, 0);   // Obtener una matriz de ceros en out_frame
        idxs.forEach(element => {                           // Ya eliminado el índice del color deseado, recorremos con un for
            colorPlanes.set(element,dummyFrame);               // Volver cero los otros canales
        });
        cv.merge(colorPlanes,dummyFrame);                      // Combinamos las capas RGB
        // Apparently is not necessary to convert back to RGB
        cv.imshow(channelCanvas[key], dummyFrame);//        draw(STATE)
    }


    return STATE
}
var Module = {
  // https://emscripten.org/docs/api_reference/module.html#Module.onRuntimeInitialized
  onRuntimeInitialized() {
    document.getElementById('status').innerHTML = 'OpenCV.js is ready.';
  }
};

// datgui position https://stackoverflow.com/questions/40523458/dat-gui-size-and-position-of-menu-javascript-css
// https://jsfiddle.net/prisoner849/mzbohe1L/
let gui = new dat.GUI({ autoPlace: false});                         // Instancia de dat.GUI para generar un panel de configuracion para el juego
gui.domElement.id = 'gui';
gui_container.appendChild(gui.domElement);
//let cfgFolder = gui.addFolder('Processing');                                                 // Carpeta de configuracion de propiedades del procesado de imágenes

STATE['frame_controller'] = gui.add(cfg, 'frame', ['RGB','LAB','HSV']).name('Color Space');  // Configuración de la imagen mostrar como fondo del juego
STATE['thr_folder'] = gui.addFolder('Thresholding');
STATE['thresholds'] ={}
// STATE['channel_controller'] = gui.add(cfg, 'channel', ['ALL']);  // Configuración de la imagen mostrar como fondo del juego


imgElement.onload = function() {
    STATE['orgdata'] = cv.imread(imgElement,cv.CV_8UC4);
    STATE = get_colorspace(STATE);
    function dummyProcess(){
        STATE = get_colorspace(STATE)
    }
    STATE['frame_controller'].onChange(dummyProcess)
    
    //frame.delete();
};

/*

    let the_color = new cv.Mat(frame.matSize[0], frame.matSize[1], cv.CV_8UC4);      // Reserva de una matriz que guardara unicamente la capa de color indicada por el usuario

    let colorPlanes = new cv.MatVector();                                     // Reserva de un vector que guardara las capas de color de la imagen RGB por separado

    //cfgFolder = gui.addFolder('Thresholding');
    //var thresholds = {}


    if (cfg.channel!='ALL'){
        cv.split(out_frame, colorPlanes);                        // Separar la imagen RGB en los 3 canales
        the_color = colorPlanes.get(parseInt(cfg.channel));             // Obtener la capa marcada por el usuario en las opciones
        let idxs = Array.from({length: colorPlanes.size()}, (x, i) => i);                                 // Indices de los colores
        idxs.splice(parseInt(cfg.channel),1);                     // Quitamos el indice correspondiente al color que el usuario escogió
        the_color.convertTo(out_frame, cv.CV_8UC1, 0, 0);   // Obtener una matriz de ceros en out_frame
        idxs.forEach(element => {                           // Ya eliminado el índice del color deseado, recorremos con un for
            colorPlanes.set(element,out_frame);               // Volver cero los otros canales
        });
        cv.merge(colorPlanes,out_frame);                      // Combinamos las capas RGB
        // Apparently is not necessary to convert back to RGB
    }


    draw()
    return

*/