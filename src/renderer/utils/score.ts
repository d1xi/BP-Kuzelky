export type LaneResult = {
        name: string;
        full: number;
        clearing: number;
        total: number;
        missed: number;
        points: number;
};

export type Row = {
        name: string;
        total: LaneResult;
        lane1: LaneResult;
        lane2: LaneResult;
        open: boolean;
};