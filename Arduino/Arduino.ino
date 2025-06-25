#include <Arduino.h>
#include <Servo.h>

// Criar os objetos Servo
Servo servo_3;
Servo servo_5;
Servo servo_6;
Servo servo_9;
Servo servo_10;

void abrirMao() {
  servo_3.write(0);
  servo_5.write(0);
  servo_6.write(0);
  servo_9.write(0);
  servo_10.write(0);
}

void fecharMao() {
  servo_3.write(185);
  servo_5.write(210);
  servo_6.write(180);
  servo_9.write(210);
  servo_10.write(190);
}

void modoCool() {
  servo_3.write(0);
  servo_5.write(0);
  servo_6.write(0);
  servo_9.write(0);
  servo_10.write(190);
}

void setup() {
  Serial.begin(9600); // Comunicação com o browser ou Serial Monitor

  servo_3.attach(3);
  servo_5.attach(5);
  servo_6.attach(6);
  servo_9.attach(9);
  servo_10.attach(10);

  abrirMao(); // Estado inicial
}

void loop() {
  if (Serial.available()) {
    Serial.println("A receber...");

    String comando = Serial.readStringUntil('\n');
    comando.trim();        // Remove espaços ou quebras de linha
    comando.toLowerCase(); // Converte para minúsculas

    Serial.println("Comando recebido: " + comando);

    if (comando == "open") {
      abrirMao();
    } else if (comando == "close") {
      fecharMao();
    } else if (comando == "cool") {
      modoCool();
    } else {
      Serial.println("Comando desconhecido: " + comando);
    }
  }
}
