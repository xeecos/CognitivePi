#include <SoftwareSerial.h>
#include <TFTEngine.h>
#include <MeMegaPi.h>

MeMegaPiDCMotor motor(PORT1A);
MeMegaPiDCMotor pump(PORT1B);
MePS2 joystick(PORT_15);
TFTEngine tft(A9,A8);
Servo sv1;
Servo sv2;
float cx = 160, cy = 120, focalLength = 2000.0;
int tx=0,ty=0;
float verts[24] = {10,-10,10, 10,10,10, -10,10,10, -10,-10,10, 10,-10,-10, 10,10,-10, -10,10,-10, -10,-10,-10};
uint8_t vertices[24] = {0,1,0,3,0,4,1,2,1,5,2,3,2,6,3,7,4,5,4,7,5,6,6,7};
vector3d points[8];
vector3d currentPoints[8];
vector2d positions[8];
TFTLine lines[12];
TFTText list;
TFTText keys;
String commands[16];
String routes[15];
String _buffer = "";
int routesLength = 2;
String str1 = "abcdef789ghijkl456mnopqr123stuvwx0,.yz!@#$%^&";
int _mode = 0;
int t = 0;
int _page = 0;
int lastKey = 0;
bool _is3DMode = false,_isIPMode = false,_isFanMode = false,_isPumpMode = false;
float angle = 0;
bool redrawing = false;
bool _isCaps = false;
String _password = "";
String _wifi = "";
unsigned long animateTime = 0;
TFTText txt;
#define WIFI_LIST 0
#define KEYBOARD_VIEW 1
void setup(){
  tft.start();
  joystick.begin(115200);
  Serial.begin(115200);
  Serial2.begin(115200);
  delay(1000);
  Serial2.println("hello,world");
  for(int i=0;i<8;i++){
    points[i].x = verts[i*3]*4;
    points[i].y = verts[i*3+1]*4;
    points[i].z = verts[i*3+2]*4;
  }
  tft.cls();
  initWiFiList();
  sv1.attach(A10);
  sv2.attach(A11);
  delay(1000);
  updateWiFi();
}
void parseBuffer(){
  int startIndex = 0;
  int endIndex = -1;
  int index = 0;
  int len = _buffer.length();
  while(1){
    endIndex = _buffer.indexOf(",",startIndex);
    if(endIndex>0){
      commands[index] = _buffer.substring(startIndex,endIndex);
      index++;
      startIndex = endIndex+1;
    }
    if(index>15||endIndex==-1){
      if(startIndex<len){
        commands[index] = _buffer.substring(startIndex,len);
        index++;
      }
      break;
    }
  }
  if(commands[0].equals("wifi")){
    routesLength = index-1;
    for(int i=0;i<routesLength;i++){
      routes[i] = commands[i+1];
    }
    initWiFiList();
    _is3DMode = false;
  }else if(commands[0].equals("motor")){
    motorRun(commands[1].toInt(),commands[2].toInt());
  }else if(commands[0].equals("sensor")){
    readSensor(commands[1].toInt());
  }else if(commands[0].equals("ip")){
    list.text(commands[1]);
    list.setBackgroundMode(3);
    list.position(80,110);
    tft.draw(&list);
    tft.render();
  }else if(commands[0].equals("fan")){
    fanRun(commands[1].toInt());
  }else if(commands[0].equals("debug")){
    tft.cls();
    list.text(commands[1]);
    list.setBackgroundMode(3);
    list.position(80,110);
    tft.draw(&list);
    tft.render();
  }
}
void autoPump(){
  int t = analogRead(A13);
  if(t>450&&_isPumpMode){
    pump.run(80);
  }else{
    pump.stop();
  }
}
void motorRun(int port,int speed){
  
}
void readSensor(int sensor){
  
}
void fanRun(int mode){
  sv1.attach(A10);
  sv2.attach(A11);
  _isFanMode = mode;
}
void loop(){
  if(Serial2.available()){
    char c = Serial2.read();
    if(c=='\n'){
      parseBuffer();
      _buffer = "";
    }else{
      _buffer+=c;
    }
  }
  
  autoPump();
  joystick.loop();
  if (joystick.currentKey()!=MeJOYSTICK_UP&&joystick.ButtonPressed(MeJOYSTICK_UP))
  {
    if(!_is3DMode){
      if(_mode==WIFI_LIST){
        t--;
        t = max(0,t);
        updateWiFiList();
      }else{
        t-=9;
        if(t<0){
          t+=45;
        }
        updateKeyboard();
      }
    }
  }else if (joystick.currentKey()!=MeJOYSTICK_DOWN&&joystick.ButtonPressed(MeJOYSTICK_DOWN))
  {
    if(!_is3DMode){
      if(_mode==WIFI_LIST){
        t++;
        t = min(4,t);
        updateWiFiList();
      }else{
        t+=9;
        if(t>44){
          t-=45;
        }
        updateKeyboard();
      }
    }
  }else if (joystick.currentKey()!=MeJOYSTICK_LEFT&&joystick.ButtonPressed(MeJOYSTICK_LEFT))
  {
    if(_mode==WIFI_LIST){
      _page--;
      _page = max(0,_page);
      
      initWiFiList();
    }
    if(_mode==KEYBOARD_VIEW){
      t = floor(t/9)*9+fmod(t,9)-1;
      if(t<0){
        t+=45;
      }
      updateKeyboard();
    }
  }
  else if (joystick.currentKey()!=MeJOYSTICK_RIGHT&&joystick.ButtonPressed(MeJOYSTICK_RIGHT))
  {
    if(_mode==WIFI_LIST){
      _page++;
      _page = min(ceil(routesLength/5),_page);
      initWiFiList();
    }
    if(_mode==KEYBOARD_VIEW){
      t = floor(t/9)*9+fmod(t,9)+1;
      if(t>44){
        t-=45;
      }
      updateKeyboard();
    }
  }
  else if (joystick.currentKey()!=MeJOYSTICK_ROUND&&joystick.ButtonPressed(MeJOYSTICK_ROUND))
  {
    if(_mode==WIFI_LIST){
      _wifi = routes[t];
      t = 0;
      lastKey = 0;
      _is3DMode = false;
      initKeyboard();
    }else{
      appendPassword();
    }
  }
  else if (joystick.currentKey()!=MeJOYSTICK_XSHAPED&&joystick.ButtonPressed(MeJOYSTICK_XSHAPED))
  {
    if(_mode==KEYBOARD_VIEW){
      removePassword();
    }
  }else if (joystick.currentKey()!=MeJOYSTICK_START&&joystick.ButtonPressed(MeJOYSTICK_START))
  {
    if(_mode==KEYBOARD_VIEW){
      setupWiFi();
    }
  }else if (joystick.currentKey()!=MeJOYSTICK_SELECT&&joystick.ButtonPressed(MeJOYSTICK_SELECT))
  {
    if(_mode==WIFI_LIST){
      updateWiFi();
    }
  }
  else if (joystick.currentKey()!=MeJOYSTICK_R1&&joystick.ButtonPressed(MeJOYSTICK_R1))
  {
    if(_mode==KEYBOARD_VIEW){
      _isCaps = !_isCaps;
      _is3DMode = false;
      initKeyboard();
    }
  }
  else if (joystick.currentKey()!=MeJOYSTICK_R2&&joystick.ButtonPressed(MeJOYSTICK_R2))
  {
    if(_mode==WIFI_LIST){
//      _isFanMode = !_isFanMode;
        _isPumpMode = !_isPumpMode;
    }
  }
  else if (joystick.currentKey()!=MeJOYSTICK_L1&&joystick.ButtonPressed(MeJOYSTICK_L1))
  {
    if(_mode==WIFI_LIST){
      _is3DMode = !_is3DMode;
      if(_is3DMode){
        tft.cls();
        tft.render();
        sv1.detach();
        sv2.detach();
      }else{
        initWiFiList();
      }
    }
  }else if (joystick.currentKey()!=MeJOYSTICK_L2&&joystick.ButtonPressed(MeJOYSTICK_L2))
  {
    if(_mode==WIFI_LIST){
      _isIPMode = !_isIPMode;
      if(_isIPMode){
        tft.cls();
        tft.render();
        Serial2.println("ip,all");
      }else{
        initWiFiList();
      }
    }
  }
  if(_is3DMode){
    update3DBox();
  }
  if(_isFanMode){
    updateFan();
    motor.run(100);
  }else{
    motor.stop();
  }
}
void setupWiFi(){
  Serial2.print(" setup,");
  Serial2.print(_wifi);
  Serial2.print(",");
  Serial2.println(_password);
  initWiFiList();
  _is3DMode = true;
}
void updateWiFi(){
  Serial2.println(" wifi,all");
}
void initWiFiList(){
  _mode = WIFI_LIST;
  _wifi = "";
  _password = "";
  t = 0;
  lastKey = 0;
  tft.cls();
  for(int i=0;i<5;i++){
    list.text(routes[_page*5+i]);
    list.setBackgroundMode(t==i?1:0);
    list.position(20,20+45*i);
    tft.draw(&list);
  }
  list.text(routes[_page*5+t]);
  list.setBackgroundMode(1);
  list.position(20,20+45*t);
  tft.draw(&list);
  tft.render();
}
void updateWiFiList(){
  if(lastKey>-1){
    list.text(routes[_page*5+lastKey]);
    list.setBackgroundMode(0);
    list.position(20,20+45*lastKey);
    tft.clear(&list);
    tft.draw(&list);
  }
  list.text(routes[_page*5+t]);
  list.setBackgroundMode(1);
  list.position(20,20+45*t);
  tft.draw(&list);
  tft.render();
  lastKey = t;
}
void initKeyboard(){
  _mode = KEYBOARD_VIEW;
  int w = 35;
  tft.cls();
  for(int i=0;i<45;i++){
    String s = str1.substring(i,i+1);
    if(_isCaps){
      s.toUpperCase();
    }
    keys.text(s);
    keys.position(20+fmod(i,9.0)*w,20+floor((i)/9.0)*w);
    keys.setBackgroundMode(i==t?3:0);
    tft.draw(&keys);
  }
  String s = str1.substring(t,t+1);
  if(_isCaps){
    s.toUpperCase();
  }
  keys.text(s);
  keys.position(20+fmod(t,9.0)*w,20+floor((t)/9.0)*w);
  keys.setBackgroundMode(3);
  tft.draw(&keys);
   tft.clear(&txt);
   txt.text(_password);
   txt.position(20,200);
   txt.setBackgroundMode(3);
   tft.draw(&txt);
   tft.render();
}
void updateKeyboard(){
  int w = 35;
  String s;
  if(lastKey>-1){
    s = str1.substring(lastKey,lastKey+1);
    if(_isCaps){
      s.toUpperCase();
    }
    keys.text(s);
    keys.position(20+fmod(lastKey,9.0)*w,20+floor((lastKey)/9.0)*w);
    keys.setBackgroundMode(0);
    tft.clear(&keys);
    tft.draw(&keys);
  }
  s = str1.substring(t,t+1);
  if(_isCaps){
    s.toUpperCase();
  }
  keys.text(s);
  keys.position(20+fmod(t,9.0)*w,20+floor((t)/9.0)*w);
  keys.setBackgroundMode(3);
  tft.draw(&keys);
  tft.render();
  lastKey = t;
}
void appendPassword(){
  String s = str1.substring(t,t+1);
  if(_isCaps){
    s.toUpperCase();
  }
  _password += s;
  tft.clear(&txt);
  txt.text(_password);
  txt.position(20,200);
  txt.setBackgroundMode(3);
  tft.draw(&txt);
  tft.render();
}
void removePassword(){
  if(_password.length()>0){
     _password = _password.substring(0,_password.length()-1);
     tft.clear(&txt);
     txt.text(_password);
     txt.position(20,200);
     txt.setBackgroundMode(3);
     tft.draw(&txt);
     tft.render();
  }else{
    removeKeyboard();
    initWiFiList();
  }
}
void removeKeyboard(){  
  tft.cls();
}
void update3DBox(){
  if(millis()-animateTime>25){
    tx+=10;
    ty+=10;
    tx = tx>359?0:tx;
    ty = ty>359?0:ty;
    drawView();
    tft.render();
    animateTime = millis();
  }
}
void updateFan(){
  if(millis()-animateTime>25){
    angle+=2.0*PI/180.0;
    angle = (angle>PI*2)?(angle-PI*2):angle;
    sv1.write(120+20*sin(angle));
    sv2.write(90+20*cos(angle));
    animateTime = millis();
  }
}
void drawView() 
{
  int i;
  float t=tx*PI/180.0;
  float p=ty*PI/180.0;
  for(i=0;i<8;i++){
    currentPoints[i] = pointNewView(points[i],t,p);
    positions[i].x = cx+focalLength/(focalLength-currentPoints[i].x)*currentPoints[i].y;
    positions[i].y = cy-focalLength/(focalLength-currentPoints[i].x)*currentPoints[i].z;
  }
  for(i=0;i<12;i++){
    lines[i].start(positions[vertices[i*2]].x,positions[vertices[i*2]].y);
    lines[i].end(positions[vertices[i*2+1]].x,positions[vertices[i*2+1]].y);
    tft.draw(&lines[i]);
  }
}

vector3d pointNewView(vector3d v,float theta, float phi) 
{
  vector3d newCoords;
  newCoords.x = v.x*cos(theta)*sin(phi)+v.y*sin(theta)*sin(phi)+v.z*cos(phi);
  newCoords.y = -v.x*sin(theta)+v.y*cos(theta);
  newCoords.z = -v.x*cos(theta)*cos(phi)-v.y*sin(theta)*cos(phi)+v.z*sin(phi);
  return newCoords;
}
