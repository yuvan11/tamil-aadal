import * as _ from "lodash";
import ReactDOM from "react-dom";
import { useState, useRef, useEffect } from "react";
import * as UC from "../unicode-utils";
import { States } from "../game";

function mapStateToUIProperties(letterState, posState) {
    let color = "notthere";
    let anim = "animate-flip";
    let emoji = String.fromCodePoint(0x2b1b);
    if (letterState === States.LETTER_ELSEWHERE) {
        color = "jumbled";
        anim = "animate-bounce";
        emoji = String.fromCodePoint(0x1f7e8);
    } else if (letterState === States.LETTER_MATCHED) {
        color = "correct";
        anim = "animate-none";
        emoji = String.fromCodePoint(0x1f7e9);
    } else if (letterState === States.LETTER_NOT_FOUND) {
        color = "notthere";
        anim = "animate-focus";
        emoji = String.fromCodePoint(0x2b1b);
    } else if (letterState === States.LETTER_UNKNOWN) {
        color = "unknown";
        anim = "animate-flip";
        emoji = String.fromCodePoint(0x2b1b);
    }
    return { color, anim, emoji };
}

export function Tile({ letter, letterState, posState, globalLetterState, isResult = false, anim = "animate-none" }) {
    let order = { unknown: 0, notthere: 1, jumbled: 2, correct: 3 };
    let { color } = mapStateToUIProperties(letterState, posState);
    if (globalLetterState && globalLetterState[letter]) {
        globalLetterState[letter].forEach((st) => {
            let m = mapStateToUIProperties(st);
            if (order[color] < order[m.color]) {
                color = m.color;
            }
        });
    }
    let st = `tile-${color} ${anim}`;
    return <div className={st}>{isResult ? String.fromCodePoint(0x1f7e9) : letter}</div>;
}

export function Tiles({ words, word_length, isResult = false, heading = true }) {
    const divEl = useRef(null);
    const resultTilesPreRef = useRef(null);
    let wordTiles = [];
    if (!isResult && heading) {
        for (let i = 1; i <= word_length; i++) {
            wordTiles.push(<Tile letter={i} color="gray" />);
        }
    }
    words.forEach(({ word, result }) => {
        let i = 0;
        word.forUnicodeEach((w) => {
            let color = "notthere";
            let emoji = String.fromCodePoint(0x2b1b);
            if (result[i][0] === States.LETTER_ELSEWHERE) {
                color = "jumbled";
                emoji = String.fromCodePoint(0x1f7e8);
            } else if (result[i][0] === States.LETTER_MATCHED) {
                color = "correct";
                emoji = String.fromCodePoint(0x1f7e9);
            }
            if (!isResult) {
                wordTiles.push(
                    <Tile
                        key={`key-${w}-${i}`}
                        letterState={result[i][0]}
                        posState={result[i].length > 1 ? result[i][1] : undefined}
                        letter={w}
                        color={color}
                    ></Tile>
                );
            } else {
                wordTiles.push(emoji);
            }
            i += 1;
        });
    });
    useEffect(() => {
        if (divEl && divEl.current) {
            divEl.current.scrollTop = divEl.current.scrollHeight;
        }
    });

    let shareText = "";
    if (isResult) {
        let tileMatrix = _.join(
            _.map(_.chunk(wordTiles, word_length), (x) => _.join(x, "")),
            "\n"
        );
        shareText = `Tamil Wordle (${words.length} tries)\n${tileMatrix}`;
    }

    async function OnCopyClick() {
        await navigator.clipboard.writeText(shareText);
        alert(`Copied to clipboard! Use your favourite tool to share!\n\n${shareText}`);
    }
    async function onShareClick() {
        if (navigator.share) {
            await navigator.share(shareText);
        } else {
            await OnCopyClick();
        }
    }

    let st = "g" + word_length;
    return !isResult ? (
        <div className={st} ref={divEl}>
            {wordTiles}
        </div>
    ) : (
        <div ref={resultTilesPreRef} className="space-x-2">
            <pre>{shareText}</pre>
            <button
                className="rounded bg-green-300 p-1 text-blue-800 hover:bg-green-500"
                onClick={(e) => OnCopyClick()}
            >
                Copy
            </button>
            {navigator.share ? (
                <button
                    className="rounded bg-green-300 p-1 text-blue-800 hover:bg-green-500"
                    onClick={(e) => onShareClick()}
                >
                    Share
                </button>
            ) : null}
        </div>
    );
}

export function TilesHint({ word, word_length, status, letterStatus, posHint }) {
    let hint = [];
    let i = 0;
    //console.log(word, status, letterStatus);
    word.forUnicodeEach((x) => {
        let { color, anim } = mapStateToUIProperties(status[i]);

        if (i < word_length)
            hint.push(
                <Tile
                    letter={x}
                    letterState={status[i]}
                    posState={posHint && posHint.length > i ? posHint[i] : undefined}
                    globalLetterState={letterStatus}
                    anim={anim}
                />
            );
        i += 1;
    });
    let gl = `g${word_length}`;
    return <div className={gl}>{hint}</div>;
}
