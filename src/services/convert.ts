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
    // read config file
    const configPath = path.join(process.cwd(), "config.json");
    const config = JSON.parse(fs.readFileSync(configPath).toString());
    this.inFolderPath = path.resolve(process.cwd(), config.inFolderPath);
    this.outFolderPath = path.resolve(process.cwd(), config.outFolderPath);
    this.threshold = config.threshold;
  }

  public start(): void {
    const directories = fs
      .readdirSync(this.inFolderPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    directories.forEach((directory) => {
      const fileNames = fs
        .readdirSync(path.join(this.inFolderPath, directory))
        .filter((name) => name.endsWith(".mid") || name.endsWith(".midi"));

      fileNames.forEach((fileName) => {
        const filePath = path.join(this.inFolderPath, directory, fileName);
        const midiData = fs.readFileSync(filePath);
        const midiParsed = midi.parseMidi(midiData);
        console.info(`Detecting chords: "${filePath}"`);
        this.detectChords(`${directory}/${fileName}`, midiParsed);
      });
    });
    console.info(`Finished!`);
  }

  private detectChords(outFilePath: string, midiParsed: midi.MidiData): void {
    // use the note events of the first track that has any note
    const noteEvents = midiParsed.tracks.find((track) =>
      track.some((event) => event.type === "noteOn")
    );
    if (!noteEvents) {
      console.error("None of the tracks has notes!");
      return;
    }

    const chordSet: ChordSet = { CHORD: [] };
    const notesOn: number[] = [];
    const chords: number[][] = [];

    noteEvents.forEach((event) => {
      if (event.type === "noteOn") {
        notesOn.push(event.noteNumber);
      } else if (event.type === "noteOff" && event.deltaTime > this.threshold) {
        // if deltaTime is greater than the threshold, it's the end of the current chord
        chords.push([...new Set(notesOn)]);
        notesOn.length = 0;
      }
    });

    // handle the last chord if notesOn is not empty
    if (notesOn.length) {
      chords.push([...new Set(notesOn)]);
    }

    chords.forEach((chord) => {
      const chordXml: Chord = { NOTE: [] };
      chord.forEach((note) => chordXml.NOTE.push({ MIDI: note }));
      chordSet.CHORD.push(chordXml);
    });

    const xml = this.getChordSetXml(chordSet);
    this.saveChordsXml(xml, outFilePath);
  }

  private getChordSetXml(chordSet: ChordSet): string {
    const xml = [];

    xml.push(`<?xml version="1.0" encoding="UTF-8"?>\n\n`);
    xml.push(`<CHORDSET version="2" uuid="${this.generateUuid()}">\n`);
    chordSet.CHORD.forEach((chord) => {
      xml.push(`  <CHORD>\n`);
      chord.NOTE.forEach((note) => {
        xml.push(`    <NOTE MIDI="${note.MIDI}"/>\n`);
      });
      xml.push(`  </CHORD>\n`);
    });
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
    const segments = [8, 4, 4, 4, 12];
    const randomChar = () => Math.floor(Math.random() * 16).toString(16);
    return segments
      .map((segment) => Array.from({ length: segment }, randomChar).join(""))
      .join("-");
  }
}
