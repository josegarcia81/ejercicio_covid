
/**
 * Description placeholder
 *
 * @export
 * @class CovidData
 * @typedef {CovidData}
 */
export class CovidData{

    constructor(
        private positive: number, 
        private state: string,
        private total: number,
        private positiveIncrease: number,
        private hospitalizedCumulative: number,
        private hospitalizedCurrently: number,
        private totalTestResults: number,
        private stateName?: string | undefined,// Propiedad que puede existir o no
        private population?: number | undefined,
        private casePerc?: number | undefined,
        private hospPerc?: number | undefined

    ){}

    public getPositive(): number {
            return this.positive;
    }
    public setPositive(value: number) {
        this.positive = value;
    }

    public getState(): string {
        return this.state;
    }
    public setState(value: string) {
        this.state = value;
    }

    public getTotal(): number {
        return this.total;
    }
    public setTotal(value: number) {
        this.total = value;
    }

    public getPositiveIncrease(): number {
        return this.positiveIncrease;
    }
    public setPositiveIncrease(value: number) {
        this.positiveIncrease = value;
    }

    public getHospitalizedCumulative(): number {
        return this.hospitalizedCumulative;
    }
    public setHospitalizedCumulative(value: number) {
        this.hospitalizedCumulative = value;
    }

    public getHospitalizedCurrently(): number {
        return this.hospitalizedCurrently;
    }
    public setHospitalizedCurrently(value: number) {
        this.hospitalizedCurrently = value;
    }

    public getTotalTestResults(): number {
        return this.totalTestResults;
    }
    public setTotalTestResults(value: number) {
        this.totalTestResults = value;
    }

    public getStateName(): string | undefined {
        return this.stateName;
    }
    public setStateName(value: string) {
        this.stateName = value;
    }
    public getPopulation(): number | undefined {
        return this.population;
    }
    public setPopulation(value: number | undefined) {
        this.population = value;
    }
    public getHospPerc(): number | undefined {
        return this.hospPerc;
    }
    public setHospPerc(value: number | undefined) {
        this.hospPerc = value;
    }
    public getCasePerc(): number | undefined {
        return this.casePerc;
    }
    public setCasePerc(value: number | undefined) {
        this.casePerc = value;
    }
    
    
    
}