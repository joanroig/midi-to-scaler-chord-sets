import * as fs from "fs";
import * as midi from "midi-file";
import * as path from "path";
import { Chord } from "../models/chord";
import { ChordSet } from "../models/chord-set";

export class MidiChordDetector {
  inFolderPath: string;
  outFolderPath: string;
  threshold: number;

  constructor() {
    // Read config file
    const configPath = path.join(process.cwd(), "config.json");
    const config = JSON.parse(fs.readFileSync(configPath).toString());
    // Prepare in and out paths taking into account if they are relative or absolute
    if (!path.isAbsolute(config.inFolderPath)) {
      this.inFolderPath = path.join(process.cwd(), `${config.inFolderPath}`);
    } else {
      this.inFolderPath = config.inFolderPath;
    }
    if (!path.isAbsolute(config.outFolderPath)) {
      this.outFolderPath = path.join(process.cwd(), `${config.outFolderPath}`);
    } else {
      this.outFolderPath = config.outFolderPath;
    }
    // Set threshold
    this.threshold = config.threshold;
  }

  public start(): void {
    const directories = fs
      .readdirSync(this.inFolderPath, { withFileTypes: true })
      .filter((dirent): boolean => dirent.isDirectory())
      .map((dirent): string => dirent.name);

    for (const directory of directories) {
      const fileNames = fs
        .readdirSync(path.join(this.inFolderPath, directory))
        .filter(
          (name): boolean => name.endsWith(".mid") || name.endsWith(".midi")
        );

      for (const fileName of fileNames) {
        const filePath = path.join(this.inFolderPath, directory, fileName);
        const midiData = fs.readFileSync(filePath);
        const midiParsed = midi.parseMidi(midiData);
        console.info(`Detecting chords: "${filePath}"`);
        this.detectChords(`${directory}/${fileName}`, midiParsed);
      }
    }
    console.info(`Finished!`);
  }

  private detectChords(outFilePath: string, midiParsed: midi.MidiData): void {
    // Use the note events of the first track that has any note
    let noteEvents;
    for (const track of midiParsed.tracks) {
      for (const event of track) {
        if (event.type === "noteOn") {
          noteEvents = track;
        }
      }
    }
    if (!noteEvents) {
      console.error("None of the tracks of has notes!");
      return;
    }

    const chordSet: ChordSet = { CHORD: [] };
    const notesOn: number[] = []; // track all noteOn events
    const chords: number[][] = []; // store all chords found

    for (const event of noteEvents) {
      if (event.type === "noteOn") {
        notesOn.push(event.noteNumber);
      } else if (event.type === "noteOff") {
        const deltaTime = event.deltaTime;
        if (deltaTime > this.threshold) {
          // if deltaTime is greater than the threshold, it's the end of the current chord
          chords.push([...new Set(notesOn)]); // add the chord to the chords array, using a Set to remove duplicates
          notesOn.length = 0; // clear the notesOn array
        }
      }
    }

    // handle the last chord if notesOn is not empty
    if (notesOn.length) {
      chords.push([...new Set(notesOn)]);
    }

    for (const chord of chords) {
      const chordXml: Chord = { NOTE: [] };
      for (const note of chord) {
        chordXml.NOTE.push({ MIDI: note });
      }
      chordSet.CHORD.push(chordXml);
    }

    const xml = this.getChordSetXml(chordSet);
    this.saveChordsXml(xml, outFilePath);
  }

  private getChordSetXml(chordSet: ChordSet): string {
    const xml = [];

    xml.push(`<?xml version="1.0" encoding="UTF-8"?>\n\n`);
    xml.push(`<CHORDSET version="2" uuid="${this.generateUuid()}">\n`);
    for (const chord of chordSet.CHORD) {
      xml.push(`  <CHORD>\n`);
      for (const note of chord.NOTE) {
        xml.push(`    <NOTE MIDI="${note.MIDI}"/>\n`);
      }
      xml.push(`  </CHORD>\n`);
    }
    xml.push(`</CHORDSET>\n`);

    const res = xml.join("");
    return res;
  }

  private saveChordsXml(xml: string, outFilePath: string): void {
    const fileName =
      path.basename(outFilePath, path.extname(outFilePath)) + ".xml";
    outFilePath = path.join(
      this.outFolderPath,
      path.dirname(outFilePath),
      fileName
    );
    // create the directory if it doesn't exist
    const directoryPath = path.dirname(outFilePath);
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    // write the file
    console.info(`Saving scaler set: "${outFilePath}"`);
    fs.writeFileSync(outFilePath, xml);
  }

  private generateUuid(): string {
    let uuid = "";
    const chars = "abcdef0123456789";
    const segments = [8, 4, 4, 4, 12];

    segments.forEach((segment, index) => {
      for (let i = 0; i < segment; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        uuid += char;
      }
      if (index !== segments.length - 1) {
        uuid += "-";
      }
    });

    return uuid;
  }
}
