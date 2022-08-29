//defining variables and constants
var c;
var undo_stack = [];
var btn = {};
var active = '';
var vars;
var chosen_btn = 'p1';
var is_masked = false;
const START_X = 10;
const START_Y = 10;
const LENGTH = 400;
let canvas;
let draw_line = true;
let show_btn = true;
const colorFileCount = 36;
const colorsInRow = 5;
const colorsWidth = 80;
const colorsHeight = 80;
const colorFiles = [];
let lastClick_x = -100;
let lastClick_y = -100;
const lastClickRadius = 10;
const lastChosenW = 10;
const lastChosenH = 10;
let lastClickColor;
let lastChosenColor;

// a function to load images (canvas, colorwheel, ...)
function preload() {

  for (let i = 1; i <= colorFileCount; i++) {
    let file_name = 'ca/' + i + '.png';
    colorFiles[i - 1] = loadImage(file_name);
  }
}

function setup() {
  // createCanvas(700, 580);
  // create color markers: "last clicked color" and "last chosen color"
  lastClickColor = color(0, 0, 0);
  lastChosenColor = color(255,255,255);
  let colorpicker_maxh = ceil(colorFileCount/colorsInRow)*colorsHeight + 50;
  createCanvas(LENGTH + 50 + colorsInRow*colorsWidth, colorpicker_maxh > LENGTH + 200?colorpicker_maxh : LENGTH + 200);

  for (let i = 0; i < colorFileCount; i++)
    colorFiles[i].loadPixels();

  c = {
    // primary triangles
    p1: color(255, 255, 255),
    p2: color(255, 255, 255),
    p3: color(255, 255, 255),

    // secondary triangles
    s1: color(227, 6, 156),
    s2: color(58, 136, 254),
    s3: color(255, 252, 64),

    line: color(0, 0, 0),
    bg: color(200),


  };

  // defining 12 arcs
  for (let i = 1; i <= 12; i++)
    c['arc' + i] = color(128);

  vars = calc_vars(START_X, START_Y, LENGTH);
  button_panel(vars);

  undoPush();
}

function draw() {

  background(c.bg);

  if (is_masked) {
    masked(vars, c);
    // colorSelection(vars);
  } else {
    colorWheel(vars, c);
    colorSelection(vars);
  }
}

//check where we clicked in color palette. if we click somewhere out of the color palette no color will be chosen, but by clicking or dragging the color from the palette we would be able to fill the selected area.
function inColorPicker() {
  const {
    x,
    w,
    y
  } = vars;
  let lines = Math.ceil(colorFileCount / colorsInRow);
  if (!(mouseX > 20 + x + w && mouseX < x + 20 + w + colorsInRow * colorsWidth &&
      mouseY > y && mouseY < y + lines * colorsHeight)) {
    return false; // Not in the color picker menu
  }
  let line = Math.ceil((mouseY - y) / colorsHeight);
  let cell = Math.ceil((mouseX - x - 20 - w) / colorsWidth);

  if (line == lines) {
    if (cell > colorFileCount % colorsInRow && colorFileCount % colorsInRow != 0) {
      return false;
    }
  }

  return true;
}

function mouseReleased() {
  setColor();
}

function mousePressed() {
  if (!inColorPicker())
    return;

  undoPush();
}

function mouseDragged() {
  setColor();
}

function setColor() {
  const {
    x,
    w,
    y
  } = vars;

  if (!inColorPicker())
    return;


  let line = Math.ceil((mouseY - y) / colorsHeight) - 1;
  let cell = Math.ceil((mouseX - x - 20 - w) / colorsWidth) - 1;

  img = colorFiles[line * colorsInRow + cell];

  let localX = mouseX - x - w - 20 - cell * colorsWidth;
  let localY = mouseY - y - line * colorsHeight;

  let picked = img.get(localX, localY);

  c[chosen_btn] = picked;
}

function calc_vars(x, y, w) {
  
  //The half lenght of a square as an area which we sketch something in.
  
  const r = w / 2.0;
  
   //In this calcuations we have used the equvalent amount of sin(theta) and cos(theta) for higher accuracy.
  
   //The coordinate of the center of the circle. It has x and y because: a) it is coordinate and wiyhout x and y it would be the lenght of a vector b) if you change the location of some part of the picture other parts will change proportional to the center and new location.

  const center_x = x + w / 2.0;
  const center_y = y + w / 2.0;

    // The radius of inner circle is equal to mutiple of the outer circle radius. We choose 2.5/4 because it seems fitter than other coefficients, but it is changable.
  const r1 = r * 2.5 / 4.0;
  
  // The radius of outer circle is equal to r which is defined as w/2.0.
  const r2 = r;

  const start_degree = 6 * QUARTER_PI - QUARTER_PI / 3;

  //The position of top point of big inner triangle (the withe one):
  
  //p1_x = x of the circles' center
  const p1_x = center_x;
  
  //p1_y = y of the center - inner circle radius
  const p1_y = center_y - r1;

  //The position of left point of the big inner triangle:
  
  //p2_x = center_x - inner circle radius * cos(30)
  const p2_x = center_x - r1 * sqrt(3) / 2.0;
  
  //p2_y = center_y + inner circle radius * sin(30)
  const p2_y = center_y + r1 / 2.0;

  //The position of right point of the big inner triangle:
  
  //p3_x = center_xinner circle radius * cos(30)
  const p3_x = center_x + r1 * sqrt(3) / 2.0;
  
  //p3_y = center_y +inner circle radius * sin(30)
  const p3_y = center_y + r1 / 2.0;

  //The position of obtuse angle of bottom triangle:
  
  //q1_x = p1_x (or center_x)
  const q1_x = p1_x;
  
  //q1_y = center_y + inner circle radius
  const q1_y = center_y + r1;

  //The position of obtuse angle of right triangle:
  
  //q2_x = center_x + inner circle radius * cos(30)
  const q2_x = center_x + r1 * sqrt(3) / 2.0;
  
  //q2_y = center_y + inner circle radius * sin(30)
  const q2_y = center_y - r1 / 2.0;
  
  //The position of obtuse angle of left triangle:
  
  //q3_x = center_x - inner circle radius * cos(30)
  const q3_x = center_x - r1 * sqrt(3) / 2.0;
  
  //q3_y = center_y - inner circle radius * sin(30)
  const q3_y = center_y - r1 / 2;

    //The coordinate of middle of bottom side of big inner triangle:
 
  //s1_x = center of a circles
  const s1_x = center_x;
  
  //s1_y = center_y + half of the inner circle radius
  const s1_y = center_y + r1 / 2;

  //The coordinates of middle of right side of big inner triangle:
 
  //s2_x = center_x + half of the inner circle radius * cos(30)
  const s2_x = center_x + r1 * sqrt(3) / 4;
  
  //s2_y = center_y - half of the inner circle radius * sin(30)
  const s2_y = center_y - r1 / 4;

    //The coordinate of middle of left side of big inner triangle:
  //s3_x = center_x - half of the inner circle radius * cos(30)
  const s3_x = center_x - r1 * sqrt(3) / 4;
  
  //s3_y = center_y - half of the inner circle radius * sin(30)
  const s3_y = center_y - r1 / 4;
  
  //The location of p1 button:
  
  //b_p1_x = center of circle
  const b_p1_x = center_x;
  //b_p1_y = center_y - half of the inner circle radius
  const b_p1_y = center_y - r1 / 2;
  //width and height of the buttons are undefined now, but they could be defined!
  const b_p1_w = undefined;
  const b_p1_h = undefined;

  //The location of p2 button:
  
  //b_p2_x = center_x - half of the inner circle radius * cos(30)
  const b_p2_x = center_x - r1 * sqrt(3) / 4;
  
  //b_p2_y = center_y + half of the inner circle radius * sin(30)
  const b_p2_y = center_y + r1 / 4;
  const b_p2_w = undefined;
  const b_p2_h = undefined;

  //The location of p3 button:
  
  //b_p3_x = center_x + half of the inner circle radius * cos(30)
  const b_p3_x = center_x + r1 * sqrt(3) / 4;
  
  //b_p3_y = center_y + half of the inner circle radius * sin(30)
  const b_p3_y = center_y + r1 / 4;
  const b_p3_w = undefined;
  const b_p3_h = undefined;
  
  //The position of s1 button:
  
  //b_s1_x = center_x
  const b_s1_x = center_x;
  
  //b_s1_y = center_y + 0.75 of the inner circle radius
  const b_s1_y = center_y + r1 * 3 / 4;
  const b_s1_w = undefined;
  const b_s1_h = undefined;

  //The position of s2 button:
  
  //b_s2_x = center_x - 0.75 of the inner circle * cos(30)
  const b_s2_x = center_x - r1 * 3 * sqrt(3) / 8;
  
  //b_s2_y = center_y - 0.75 of the inner circle * sin(30)
  const b_s2_y = center_y - r1 * 3 / 8;
  const b_s2_w = undefined;
  const b_s2_h = undefined;

  //The location of s2 button:
  
  //b_s3_x = center_x + 0.75 of the inner circle * cos(30)
  const b_s3_x = center_x + r1 * 3 * sqrt(3) / 8;
  
  //b_s2_y = center_y - 0.75 of the inner circle * sin(30)
  const b_s3_y = center_y - r1 * 3 / 8;
  const b_s3_w = undefined;
  const b_s3_h = undefined;

  //defining a loop for sketching arcs. They have pi/6 degree.
  const b_arc = {};
  //r3 = middle of two circles (strip)
  const r3 = r2 - (r2 - r1) / 2;
  
  // finding the position of button for each arc (center of each arc)
  for (let i = 1; i <= 12; i++) {
    let theta = 3 * PI / 2 + PI / 6 * (i - 1);
    b_arc['b_arc_x_' + i] = center_x + r3 * cos(theta);
    b_arc['b_arc_y_' + i] = center_y + r3 * sin(theta);
  };


  return {
    x,
    y,
    w,
    center_x,
    center_y,
    r,
    r1,
    r2,
    start_degree,
    p1_x,
    p1_y,
    p2_x,
    p2_y,
    p3_x,
    p3_y,
    q1_x,
    q1_y,
    q2_x,
    q2_y,
    q3_x,
    q3_y,
    s1_x,
    s1_y,
    s2_x,
    s2_y,
    s3_x,
    s3_y,
    b_p1_x,
    b_p1_y,
    b_p1_w,
    b_p1_h,
    b_p2_x,
    b_p2_y,
    b_p2_w,
    b_p2_h,
    b_p3_x,
    b_p3_y,
    b_p3_w,
    b_p3_h,
    b_s1_x,
    b_s1_y,
    b_s1_w,
    b_s1_h,
    b_s2_x,
    b_s2_y,
    b_s2_w,
    b_s2_h,
    b_s3_x,
    b_s3_y,
    b_s3_w,
    b_s3_h,
    ...b_arc
  };
}

// mask function
function masked(vars, c) {
  
  //defining "mainC" as a color of chosen area of the colorwheel
  let mainC = color(128);
  if (typeof chosen_btn != 'undefined') {
    mainC = c[chosen_btn];
  }

  let {
    center_x,
    center_y,
    r1
  } = vars;

  center_x += 200
  
  //sketching two square, one is white and the other is filled with "mainC" color
  fill(mainC);
  let w, h;
  w = h = 200;

  let distance = 200;

  background(color(255));

  noStroke()
  rect(center_x - distance - w / 2, center_y - h / 2, w, h);
  fill(color(0));
 
  stroke(color(0))
  fill(color(255));
  rect(center_x + distance - w / 2, center_y - h / 2, w, h);
  fill(color(0));

}

//uploading the colors to make the color palette
function colorSelection(vars) {
  const {
    x,
    y,
    w
  } = vars;

  let line = -1;
  for (let i = 0; i < colorFileCount; i++) {
    if (i % colorsInRow == 0)
      line++;
    image(colorFiles[i], x + w + 20 + (i % colorsInRow) * colorsWidth, y +
      line * colorsHeight);
  }

  noFill();
  stroke(lastChosenColor);
  rect(c[chosen_btn+'_x'] - lastChosenW /2, c[chosen_btn+'_y'] - lastChosenH/2, lastChosenW, lastChosenH, 1);
  stroke(lastClickColor);
  circle(lastClick_x, lastClick_y, lastClickRadius);
  
  fill(color(0));
  textSize(21);
  text("Scroll Down for instructions",x + 20 + w, y + 20 + (1+line)*colorsHeight)
}

//this function will draw the colorwheel by using the constants which are calculated above.
function colorWheel(vars, c) {

  const {
    center_x,
    center_y,
    r1,
    r2,
    start_degree,
    p1_x,
    p1_y,
    p2_x,
    p2_y,
    p3_x,
    p3_y,
    q1_x,
    q1_y,
    q2_x,
    q2_y,
    q3_x,
    q3_y,
    s1_x,
    s1_y,
    s2_x,
    s2_y,
    s3_x,
    s3_y
  } = vars;

  fill(c.line)
  if(draw_line)
    stroke(c.line)
  else
    noStroke()
  for (let i = 1; i <= 12; i++) {
    fill(c['arc' + i]);
    if (draw_line) {
      arc(center_x, center_y, r2 * 2, r2 * 2, start_degree + (i - 1) * PI / 6, start_degree + i * PI / 6, PIE);
    } else {
      arc(center_x, center_y, r2 * 2, r2 * 2, start_degree + (i - 1) * PI / 6, start_degree + i * PI / 6, PIE);
    }
  }

  fill(c.bg);
  circle(center_x, center_y, r1 * 2.0);

  noFill();
  circle(center_x, center_y, r2 * 2.0);


  triangle(p1_x, p1_y, p2_x, p2_y, p3_x, p3_y);

  fill(c.s1);
  triangle(p2_x, p2_y, p3_x, p3_y, q1_x, q1_y);


  fill(c.s3);
  triangle(p1_x, p1_y, q2_x, q2_y, p3_x, p3_y);

  fill(c.s2);
  triangle(p1_x, p1_y, p2_x, p2_y, q3_x, q3_y);


  noStroke();
  fill(c.p2);

  quad(center_x, center_y, s1_x, s1_y, p2_x, p2_y, s3_x, s3_y);

  fill(c.p1);

  quad(center_x, center_y, s2_x, s2_y, p1_x, p1_y, s3_x, s3_y);


  fill(c.p3);

  quad(center_x, center_y, s1_x, s1_y, p3_x, p3_y, s2_x, s2_y);

  if (draw_line) stroke(c.line);
  noFill();

  line(center_x, center_y, s1_x, s1_y);
  line(center_x, center_y, s2_x, s2_y);
  line(center_x, center_y, s3_x, s3_y);

}

//this function will create buttons. Two other functions are defined below which are recalled in this function: "my_create_buttons" and "toggle_buttons"
function button_panel(vars) {
  let x = vars.x + vars.w + 50;
  x = 20;
  let y = vars.y + 20;
  y = vars.y + vars.w + 20;

  const {
    b_p1_x,
    b_p1_y,
    b_p1_w,
    b_p1_h,
    b_p2_x,
    b_p2_y,
    b_p2_w,
    b_p2_h,
    b_p3_x,
    b_p3_y,
    b_p3_w,
    b_p3_h,
    b_s1_x,
    b_s1_y,
    b_s1_w,
    b_s1_h,
    b_s2_x,
    b_s2_y,
    b_s2_w,
    b_s2_h,
    b_s3_x,
    b_s3_y,
    b_s3_w,
    b_s3_h,
  } = vars;
  
  createDiv(`<div style="max-width:600px;padding-left: 30px;"><h2>ASV Tool for Constructing a Colour Wheel</h2><h3>Instructions</h3><ol><li style="padding: 5px 10px;">Click in the box in a portion of the wheel to operate on that area, the box will disappear. The colour can be changed in this selected area by clicking or dragging within the hue patches on the right hand side of the display until the desired colour appears.  Multiple changes can be made by continuing to click and undo can be used in order to return to an earlier choice.   The circular marker indicates the last chosen colour.  Save your work often.</li><li style="padding: 5px 10px;">The default setup aids in creating a wheel with "light source” primary colours for an additive system of colour generation. As a first step these secondary colours should be calibrated against printed examples of cyan, magenta, and yellow and adjusted accordingly.  These colours should also be placed in the outer rim of the wheel. </li><li style="padding: 5px 10px;"> Next the inner triangle should be filled with the additive primaries. To chose these colours one can use the after-image effect to find complementary colours.   The “Toggle Masks” button will display two patches. One with the currently selected colour and one blank.   Stare at the colour for 15 seconds and then look at the blank square. You will see an after-image in the complementary colour.  You can then toggle off the mask and select an appropriate colour from the array of patches. Fill both the triangle and the appropriate rim section. (The marker on the colour patch can aid in selecting the same colour as in the triangle for  the  rim.) </li><li style="padding: 5px 10px;"> Finally fill in tertiary colours in the outer rim of the wheel. These should be colours half way between the colours to either side of their segment.  It is helpful to toggle off the lines and boxes to check your work.</li><li style="padding: 5px 10px;">Toggle off boxes and lines. Export the file. </li></ol></div>`);
  
  my_create_btn('p1', b_p1_x, b_p1_y, b_p1_w, b_p1_h);
  my_create_btn('p2', b_p2_x, b_p2_y, b_p2_w, b_p2_h);
  my_create_btn('p3', b_p3_x, b_p3_y, b_p3_w, b_p3_h);

  my_create_btn('s1', b_s1_x, b_s1_y, b_s1_w, b_s1_h);

  my_create_btn('s2', b_s2_x, b_s2_y, b_s2_w, b_s2_h);

  my_create_btn('s3', b_s3_x, b_s3_y, b_s3_w, b_s3_h);

  for (let i = 1; i <= 12; i++) {
    my_create_btn('arc' + i, vars['b_arc_x_' + i], vars['b_arc_y_' + i]);
  }
  // Toggle line button: if we have the lines it will hide them, else it will show the lines 
  const tLine = createButton('Toggle Line');
  tLine.position(x, y + 40)
  tLine.mousePressed(() => {
    draw_line = !draw_line;
  });
  tLine.elt.style['border-radius'] = "12px";
  
  //Toggle buttons button: hide/show all buttons
  const hbtn = createButton('Toggle buttons');
  hbtn.position(x, y + 80);
  hbtn.mousePressed(() => {
    toggle_buttons()
  });
  hbtn.elt.style['border-radius'] = "12px";

  //Toggle maks buttons: it will hide the colorwheel and the palette, then it will show the mask and vice versa 
  const mbtn = createButton('Toggle Masks');
  mbtn.position(x, y + 120);
  mbtn.mousePressed(() => {
    is_masked = !is_masked;
    toggle_buttons(!is_masked);
  });
  mbtn.elt.style['border-radius'] = "12px";

  //save button: to save whatever you did
  const sbtn = createButton('Save');
  sbtn.position(x + 150, y + 40);
  sbtn.mousePressed(() => {
    tmp = {}
    for (let i in c) {
      
      if (['draw_line', 'show_btn'].indexOf(i) != -1)
        continue;
      tmp[i] = c[i].levels;
      if(!tmp[i]){
        tmp[i] = c[i];
      }
    }
    saveJSON(tmp, 'color_picker.json');
  });

  // a function to choose a file in order to upload (Choose File button).
  function handleFile(f) {
    fr = new FileReader();
    fr.readAsText(f.file);
    fr.onload = (e) => {
      tmp = JSON.parse(e.target.result);
      for (let j in tmp) {
        let i = tmp[j]
        if(typeof i == 'object')
          c[j] = color(i[0], i[1], i[2]);
        else
          c[j] = i;
      }
    };
  }

  const lbtn = createFileInput(handleFile);
  lbtn.position(x + 150, y + 80);

  const ebtn = createButton('Export');
  ebtn.position(x + 150, y + 120);
  ebtn.mousePressed(() => {
    let img = createImage(LENGTH + START_X * 2, LENGTH + START_Y * 2);
    img.loadPixels();
    loadPixels();

    for (let i = 0; i < LENGTH + START_X * 2; i++)
      for (let j = 0; j < LENGTH + START_Y * 2; j++)
        img.set(i, j, get(i, j));
    img.updatePixels();
    img.save('wheel', 'png');
    // saveCanvas('wheel', 'png');
  });

  //create undo button
  const ubtn = createButton('Undo');
  ubtn.position(x + vars.w - 50, vars.y + 20);
  ubtn.mousePressed(() => {
    undoPop();
  });
  ubtn.elt.style['border-radius'] = "50%";
}

//this function is used above to create buttons.
function my_create_btn(name, x, y, w, h) {
  if (typeof w == 'undefined')
    w = 40;
  if (typeof h == 'undefined')
    h = 30;
  let b = createButton('');
  // let b = createButton(name);
  b.position(x - w / 2, y - h / 2);
  b.size(w, h);
  b.mousePressed(() => {
    chosen_btn = name;
    toggle_buttons(true);
    b.hide();
    undoPush();
  });
  btn[name] = {
    b,
  }
}
//this function is used above to toggle buttons.
function toggle_buttons(val) {
  show_btn = !show_btn;
  if (typeof val != 'undefined')
    show_btn = val;
  for (let i in btn) {
    let b = btn[i];
    if (show_btn) {
      b.b.show()
    } else {
      b.b.hide()
    }
  }
}

//after clicking the undo button, we would be able to undo everything which we have in the undo line (see the function below).
function undoPop() {
  if (undo_stack.length > 1) {
    c = undo_stack.pop();
  } else {
    let tmp = undo_stack[0];
    for (let i in tmp)
      c[i] = tmp[i]
  }
}

//undopush function is for defining "undo". by using this function in the code everything will be transfer to the undo line.
function undoPush() {
  let prev_c = undo_stack[undo_stack.length - 1];
  let new_c = {};
  Object.assign(new_c, c);
  let changed = false;
  if (prev_c) {
    for (let i in new_c) {
      if (new_c[i] != prev_c[i]) {
        changed = true;
        break;
      }
    }
  } else {
    changed = true;
  }
  if (changed) {
    undo_stack.push(new_c);
  }
}
