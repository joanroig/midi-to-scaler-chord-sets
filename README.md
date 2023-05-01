# Midi to Scaler chord sets

Convert chord progressions from midi files to Plugin Boutique's Scaler 2 sets.

## Example

Go to the `examples` folder to see a converted midi file like this one:

<p align="center">
  <img src="examples/midi.png" alt="converted palette" width="400px"/>
  <br>
  <i>Original midi file</i>
  
</p>

<p align="center">
  <img src="examples/set.png" alt="converted palette" width="400px"/>
  <br>
  <i>Converted chord set loaded in Scaler 2</i>
</p>

## Run binaries

- [Download](https://github.com/joanroig/midi-to-scaler-chord-sets/releases) the latest release for your platform (Windows or MacOS) and unzip it.
- Group your .mid or .midi files in folders and add them to the **midis** folder. Each folder will be converted to a set (a demo set with a single chord progression is provided for a quick demo).
- Continue depending on your OS:

### Windows

- Open a Command Prompt (cmd.exe) and navigate to the unzipped folder, for example:

  `cd C:/Users/YOUR_USER/Downloads/midi-to-scaler-chord-sets_1.0.0_windows`

- Run the tool by typing in the cmd:

  `midi-to-scaler-chord-sets.exe`

- The converted files should be in the **sets** folder, copy each folder set to the custom sets folder and start using them: **C:/Users/Public/Documents/Plugin Boutique/Scaler2/Sets**

### MacOS

- Open the Terminal and navigate to the unzipped folder, for example:

  `cd /Users/YOUR_USER/Downloads/midi-to-scaler-chord-sets_1.0.0_macos`

- Grant execute permission to the tool by typing in the terminal:

  `chmod +x midi-to-scaler-chord-sets`

- Run the tool by typing in the terminal:

  `./midi-to-scaler-chord-sets`

- The converted files should be in the **sets** folder, copy each folder set to the custom sets folder and start using them: **/Users/Shared/Plugin Boutique/Scaler2/Sets**

**⚠️Warning:** Running the tool by double clicking the executable may not work because it will look for the configuration file in the home directory.

## Run from source

Be sure to have [Node.js](https://nodejs.org/en/download/) installed, then:

- [Download](https://github.com/joanroig/midi-to-scaler-chord-sets/archive/refs/heads/main.zip) or clone the repo.
- Run `npm install` in the root folder to install dependencies.
- Group your .mid or .midi files in folders and add them to the **midis** folder. Each folder will be converted to a set.
- Run `npm run convert` to run the conversion.
- The converted files should be in the **sets** folder, copy each folder set to the custom sets folder and start using them:
  - Windows path: **C:/Users/Public/Documents/Plugin Boutique/Scaler2/Sets**
  - MacOS path: **/Users/Shared/Plugin Boutique/Scaler2/Sets**

## Configuration

The input, output and threshold for chord detection can be changed in: [config.json](config.json)

### Configuration parameters

- **threshold:** time interval in MIDI ticks to determine the maximum amount of time between note-on and note-off events for the events to be considered part of the same chord.
- **inFolderPath:** folder used to read the midi files, it must contain subfolders with the midi files for each set. The name of each subfolder will name the set.
- **outFolderPath:** folder used to save the converted sets.
