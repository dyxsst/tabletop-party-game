# 🇵🇦 Fiesta Panameña

Un juego de mesa estilo Mario Party con temática panameña, jugable desde el navegador.

## 🎮 Características

- **4 tableros** con caminos que cambian dinámicamente durante la partida:
  - Canal de Panamá, Casco Viejo, Selva del Darién, Archipiélago de San Blas
- **8 personajes panameños**: Diablo Rojo 🚌, Taxi 🚕, Rana Dorada 🐸, Pollera 💃, Sombrero Pintao 🎩, Tucán 🦜, Casco Viejo 🏛️, Canal 🚢
- **2–8 jugadores** con sistema de monedas y estrellas
- **22 minijuegos** (12 digitales + 10 presenciales), incluyendo:
  - Trivia estilo "America Says" con preguntas personalizables (CSV)
  - Adivina la Canción con audio configurable
  - Matemática Relámpago, Memoria, Piedra/Papel/Tijera, y más
- **Sistema modular** para agregar nuevos juegos fácilmente
- Funciona en **GitHub Pages** (estático, sin servidor)

## 🚀 Cómo jugar

1. Abre `index.html` en un navegador (o visita el sitio de GitHub Pages)
2. Selecciona un tablero y agrega jugadores (nombre + personaje)
3. Cada ronda: lanza el dado, mueve, recoge monedas, y al final juega un minijuego
4. Compra estrellas (⭐ costo: 10 monedas) al caer en la casilla de la estrella
5. ¡El juego termina cuando se compran 5 estrellas!

## 📁 Estructura del proyecto

```
├── index.html                 # Página principal
├── css/styles.css             # Estilos
├── js/
│   ├── main.js                # Entrada de la aplicación
│   ├── config.js              # Configuración (monedas, costos, etc.)
│   ├── gameState.js           # Estado central del juego
│   ├── engine.js              # Lógica del juego (dado, movimiento, estrellas)
│   ├── renderer.js            # Renderizado del tablero
│   ├── ui.js                  # Interfaz de usuario (HUD, diálogos)
│   ├── boards.js              # Definiciones de los 4 tableros
│   ├── characters.js          # Personajes panameños
│   ├── utils.js               # Utilidades
│   └── minigames/
│       ├── base.js            # Clase base para minijuegos
│       ├── registry.js        # Registro y selección de minijuegos
│       ├── trivia.js          # Trivia (America Says)
│       ├── guessSong.js       # Adivina la Canción
│       └── ...                # 20+ minijuegos más
├── data/
│   ├── trivia_questions.csv   # Preguntas de trivia (personalizables)
│   └── songs.json             # Manifiesto de canciones
└── data/songs/                # Carpeta para archivos de audio
```

## 🎯 Agregar un nuevo minijuego

1. Crea un archivo en `js/minigames/miJuego.js`:

```javascript
import { MinigameBase } from './base.js';

export class MiJuego extends MinigameBase {
  static id = 'mi-juego';
  static name = 'Mi Juego';
  static description = 'Descripción corta';
  static rules = 'Reglas del juego';
  static types = ['ffa', '1v1'];  // Modos: ffa, 1v1, teams, 1vAll
  static minPlayers = 2;
  static isDigital = true;
  static coinReward = 10;

  async play() {
    // Renderiza el juego en this.container
    // Retorna: { winners: [índices], losers: [índices], reward: número }
  }
}
```

2. Regístralo en `js/minigames/registry.js` agregándolo al array `ALL_GAMES`.

## 📝 Personalizar preguntas de trivia

Edita `data/trivia_questions.csv` con formato:
```
question,answer1,points1,answer2,points2,...
```

## 🎵 Agregar canciones

1. Coloca archivos MP3 en `data/songs/`
2. Edita `data/songs.json` con `title`, `artist`, `file` (ruta) y `startTime` (segundo de inicio)

## ⚙️ Configuración

Edita `js/config.js` para ajustar costos, monedas iniciales, valor del dado, y recompensas.
