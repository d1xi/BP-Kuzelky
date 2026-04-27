import { useScore } from "../context/ScoreContext";
import styles from "./ScoreTable.module.css"
import React from "react";

type Props = {
    collapsible?: boolean;
}

export default function ScoreTable({collapsible = true}: Props){

    const {data, setData} = useScore();

    function toggleRow(index: number){
        setData((prev)=>
            prev.map((row, i) =>
                i === index ? { ...row, open: !row.open } : row
            )
        );
    }

    return(
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Jméno</th>
                        <th>Plné</th>
                        <th>Dorážka</th>
                        <th>Celkem</th>
                        <th>Chyby</th>
                        <th>Body</th>
                    </tr>
                </thead>

                <tbody className={styles.tbody}>
                    {data.map((row, i) =>
                        <React.Fragment key={i}>
                            <tr className={styles.mainRow} onClick={()=> collapsible && toggleRow(i)}>
                                <td> {row.total.name} </td>
                                <td> {row.total.full} </td>
                                <td> {row.total.clearing} </td>
                                <td> {row.total.total} </td>
                                <td> {row.total.missed} </td>
                                <td> {row.total.points} </td>
                            </tr> 


                            {(collapsible ? row.open : true) && (
                                <>
                                    <tr className={styles.detailRow}>
                                    <td>{row.lane1.name}</td>
                                    <td>{row.lane1.full}</td>
                                    <td>{row.lane1.clearing}</td>
                                    <td>{row.lane1.total}</td>
                                    <td>{row.lane1.missed}</td>
                                    <td>{row.lane1.points}</td>
                                    </tr>

                                    <tr className={styles.detailRow}>
                                    <td>{row.lane2.name}</td>
                                    <td>{row.lane2.full}</td>
                                    <td>{row.lane2.clearing}</td>
                                    <td>{row.lane2.total}</td>
                                    <td>{row.lane2.missed}</td>
                                    <td>{row.lane2.points}</td>
                                    </tr>
                                </>
                                )}
                        </React.Fragment>
                    )}
                </tbody>
            </table>
        </div>
    );
}