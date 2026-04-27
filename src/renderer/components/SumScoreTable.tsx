import styles from "./SumScoreTable.module.css"
import { Row } from "../utils/score";
import { useScore } from "../context/ScoreContext";

type Props = {
    data: Row[];
};

export default function SumScoreTable(){
    const { data } = useScore();

    const summary = data.reduce(
        (sum, row) => {
            sum.full += row.total.full;
            sum.clearing += row.total.clearing;
            sum.total += row.total.total;
            sum.missed += row.total.missed;
            sum.points += row.total.points;
            return sum;
        },
        {
            full: 0,
            clearing: 0,
            total: 0,
            missed: 0,
            points: 0,
        }
    );

    return(
        <div className={styles.container}>
            <table className={styles.table}>
                <thead className={styles.thead}>
                    <tr>
                        <th>Celkem</th>
                        <th>Plné</th>
                        <th>Dorážka</th>
                        <th>Chyby</th>
                        <th>Body</th>
                    </tr>
                </thead>

                <tbody className={styles.tbody}>
                    <tr className={styles.tr}>
                        <td>{summary.total}</td>
                        <td>{summary.full}</td>
                        <td>{summary.clearing}</td>
                        <td>{summary.missed}</td>
                        <td>{summary.points}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}