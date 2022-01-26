import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";

import * as _ from "lodash";
import ReactDOM from "react-dom";
import * as UC from "../unicode-utils";
import { IntlMsg } from "../messages-ta";

import { Help } from "../components/help-page";
import { Input } from "../components/word-input";
import { Tile, Tiles } from "../components/tiles";

import { useState, useRef, useEffect, useContext } from "react";


import { zonedTimeToUtc } from "date-fns-tz";
import { isAfter, sub, differenceInDays, differenceInMinutes } from "date-fns";

import { GameContext, GameProvider } from "../gameProvider";

let initialGameState = {
    updated: new Date(),
    showHelp: true,
    over: false,
    words: [], // [{word, status}]
    triedWords: {}, // map of tried Words for checking duplicates
    letterHint: {}, // {leter: [CORRECT, WRONG_PLACE, NOT THERE] for the given pos
    posHint: [], // [ [row, col] ] - for each pos, holds the row/col match in the 19x13 tamil letter matrix
};



export function Game({error}) {

    const {gameState, persistGameState, server, end_point, showSuccess } = useContext(GameContext);

    return (
        <div className="flex flex-col justify-center space-y-2">

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
                            letterStatus={gameState.letterHint}
                            posHint={gameState.posHint}
                            onGameOver
                        />
                    ) : (
                        <div className="flex mx-auto justify-center">
                            <button
                                onClick={(e) => showSuccess()}
                                className="rounded bg-indigo-600 hover:bg-indigo-200 p-1 text-white"
                            >
                                {IntlMsg.btn_game_over}
                            </button>
                        </div>
                    )}
                </div>
            )}
            <Help />
        </div>
    );
}

export default function Home({ word_length, server, end_point, error }) {
    return (
        <div className="">
            <Head>
                <title>Tamil Wordle</title>
                <meta name="description" content="A game with tamil words" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className="container flex flex-col mx-auto h-screen">
                <main className="main grow">
                    <GameProvider server={server} end_point={end_point}>
                        <Game />
                    </GameProvider>
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
