#include <Arduino.h>
#include <Servo.h>

// Criar os objetos Servo
Servo servo_3;
Servo servo_5;
Servo servo_6;
Servo servo_9;
Servo servo_10;

void setup() {
  Serial.begin(9600);

  servo_3.attach(3);
  servo_5.attach(5);
  servo_6.attach(6);
  servo_9.attach(9);
  servo_10.attach(10);

  // Posição inicial
  servo_3.write(0);
  servo_5.write(0);
  servo_6.write(0);
  servo_9.write(0);
  servo_10.write(0);
}

void abrirMao() {
  servo_3.write(185);
  servo_5.write(210);
  servo_6.write(180);
  servo_9.write(210);
  servo_10.write(190);
}

void fecharMao() {
  servo_3.write(185);
  servo_5.write(210);
  servo_6.write(180);
  servo_9.write(210);
  servo_10.write(0);
}

void modoCool() {
  servo_3.write(185);
  delay(200);
  servo_5.write(210);
  delay(200);
  servo_6.write(180);
  delay(200);
  servo_9.write(210);
  delay(200);
  servo_10.write(0);
}

void loop() {
  if (Serial.available()) {
    String comando = Serial.readStringUntil('\n');
    comando.trim();        // remove espaços e quebras de linha
    comando.toLowerCase(); // converte tudo para minúsculas

    if (comando == "open") {
      abrirMao();
    } else if (comando == "close") {
      fecharMao();
    } else if (comando == "cool") {
      modoCool();
    }
  }
}
