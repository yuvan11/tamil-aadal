import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";

import * as _ from "lodash";
import ReactDOM from "react-dom";
import * as UC from "../unicode-utils";
import { IntlMsg } from "../messages-ta";

import { Modal } from "../components/modal";
import { Success } from "../components/success-message";
import { Help } from "../components/help-page";
import { Input } from "../components/word-input";
import { Tile, Tiles } from "../components/tiles";
import { Alert } from "../components/alert";

import { useState, useRef, useEffect } from "react";
import { States } from "../game";

import {getLetterPos} from "../tamil-letters";

function Questionmark() {
    return (
        <div>
            <img src="/help.png" />
            help
        </div>
    );
}
export default function Home({ word_length, server, end_point, error }) {
    let [showHelp, updateShowHelp] = useState(true);
    let [gameState, updateGameState] = useState({
        over: false,
        word_length,
        words: [], // [{word, status}]
        triedWords: {}, // map of tried Words for checking duplicates
        letterHint: {}, // {leter: [CORRECT, WRONG_PLACE, NOT THERE] for the given pos
        posHint: [], // [ [row, col] ] - for each pos, holds the row/col match in the 19x13 tamil letter matrix
    }); // {word, result}
    let [showModal, updateShowModal] = useState(false);
    let [alert, updateAlert] = useState({msg: "", show: false, status: "error"});
    let showAlert = (status, msg) => updateAlert({...alert, msg: msg +"", status, show: true});

    function checkDuplicate(word) {
        return gameState.triedWords[word] !== undefined;
    }

    function onGameOver() {
        updateShowModal(true);
    }

    async function onNewGuess(guess) {
        gameState.triedWords[guess] = true;
        updateGameState({...gameState});
        let word = [];
        guess.forUnicodeEach((x) => word.push(x));
        try {
            const res = await fetch(`${server}/${end_point}`, {
                method: "POST",
                mode: "cors",
                cache: "no-cache",
                headers: { "Content-Type": "application/json", Accept: "*/*" },
                body: JSON.stringify(word),
            });
            if (res.status === 200) {
                let data = await res.json();
                gameState.words.push({ word: guess, result: data });
                let pos = 0;
                guess.forUnicodeEach(ch => {
                    if(!gameState.letterHint[ch])
                        gameState.letterHint[ch] = [];

                    // update the hint
                    let hint = gameState.letterHint[ch];
                    if (hint.length < word_length) {
                        for(let i=hint.length; i<word_length; i++)
                            hint.push(States.LETTER_UNKNOWN);
                    }
                    if(hint[pos] === States.LETTER_UNKNOWN) 
                        hint[pos] = data[pos][0];
                    if(data[pos] === States.LETTER_NOT_FOUND) {
                        hint.fill(States.LETTER_NOT_FOUND);
                    }

                    // update pos hints
                    if(gameState.posHint.length <= i+1) {
                        gameState.posHint.push([-1,-1]);
                        gameState.posHint.push([-1,-1]);
                    }
                    if(data[pos].length > 1) {
                        let posHint = gameState.posHint[pos];
                        if(data[pos][1] === States.MEI_MATCHED)
                            posHint[1] = getLetterPos(ch)[1];
                        else if(data[pos][1] === States.UYIR_MATCHED) {
                            posHint[0] = getLetterPos(ch)[0];
                        }
                    }

                    pos += 1;
                });
                updateGameState({ ...gameState });
            } else if (res.status === 202) {
                let data = [];
                let i = 0;
                guess.forUnicodeEach((x) => {
                    data.push([States.LETTER_MATCHED]);
                    gameState.posHint[i] = getLetterPos[x];
                    i+=1;
                });
                if (!gameState.over) {
                    gameState.words.push({ word: guess, result: data });
                    gameState.over = true;
                    updateGameState({ ...gameState });
                }
                onGameOver();
            }
        } catch (error) {
            gameState.triedWords[guess] = undefined;
            updateGameState({...gameState});
            showAlert("error", error);
            console.error(error);
        }
    }

    return (
        <div className="">
            <Head>
                <title>Tamil Wordle</title>
                <meta name="description" content="A game with tamil words" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className="container flex flex-col mx-auto h-screen">
                <main className="main grow">
                    <div className="flex flex-col justify-center space-y-2">
                        <div className="self-center flex space-x-5">
                            <div className="flex flex-col justify-center">
                                <h1 className="self-center text-2xl">{IntlMsg.game_name}</h1>
                                <h1 className="self-center text-2xl">Tamil Wordle</h1>
                            </div>
                            <div>
                                <a href="#" onClick={(e) => updateShowHelp(true)}>
                                    <Questionmark />
                                </a>
                            </div>
                        </div>
                        <Alert show={true} ><div className="bg-pink-100 p-2 underline text-blue-300"><a href="https://tamil-wordle-git-feature-uyirmei-tsureshkumar.vercel.app/">{IntlMsg.try_uyirmei}</a></div></Alert>
                        <Alert status={alert.status} show={alert.show} onHide={() => updateAlert({...alert, show: false})}>{alert.msg}</Alert>
                        
                        {error ? (
                            <div className="rounded bg-pink-300 bold">{error}</div>
                        ) : (
                            <div className="flex flex-col justify-center space-y-2">
                                <div className="flex flex-grow justify-center">
                                    <Tiles word_length={gameState.word_length} words={gameState.words} />
                                </div>
                                {!gameState.over ? (
                                    <Input
                                        word_length={gameState.word_length}
                                        onNewGuess={onNewGuess}
                                        checkDuplicate={checkDuplicate}
                                        letterStatus={gameState.letterHint}
                                        posHint={gameState.posHint}
                                        onGameOver
                                    />
                                ) : (
                                    <div className="flex mx-auto justify-center">
                                        <button
                                            onClick={(e) => updateShowModal(true)}
                                            className="rounded bg-indigo-600 hover:bg-indigo-200 p-1 text-white"
                                        >
                                            {IntlMsg.btn_game_over}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <Modal show={showModal} onClose={() => updateShowModal(false)}>
                            <Success word_length={gameState.word_length} words={gameState.words} />
                        </Modal>
                        <Help show={showHelp} onClose={() => updateShowHelp(false)} word_length={word_length}/>
                    </div>
                </main>

                <footer>
                    <hr />
                    <div className="flex flex-row space-x-2">
                        <img src="/sol.png" height="32" width="32" />
                        <div className="grow">&nbsp;</div>
                        <div>
                            <a href="https://github.com/psankar/tamil-wordle" className="underline">
                                Gidhub Project
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export async function getServerSideProps(context) {
    const server = process.env.backend_server;
    const end_point = process.env.end_point;
    try {
        const res = await fetch(`${server}/get-current-word-len`);
        const data = await res.json();

        if (!data) {
            return {
                notFound: true,
            };
        }

        return {
            props: {
                word_length: data.Length,
                server,
                end_point,
            },
        };
    } catch (err) {
        console.log(err);
        return {
            props: {
                error: "Error communicating with server",
            },
        };
    }
}
