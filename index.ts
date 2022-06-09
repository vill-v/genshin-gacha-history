import {readHar} from "./har-reader.js";

const bannerCode = {
	"100":"Beginners' Wish",
	"200":"Wanderlust Invocation",
	"301":"Character Event Wish",
	"302":"Epitome Invocation",
};
const g:any = {};
// @ts-ignore
window.globals = g;
g.file = null;
g.data = null;
g.status = "done";
g.gachaList = null;
//order from most to least significant
//positive = ascending
let columnOrder = [
	{col:"gacha_type", asc:1},
	{col:"time", asc:1},
	{col:"item_type", asc:1},
	{col:"rank_type", asc:-1},
	{col:"name", asc:1},
];
const comparators = {
	"gacha_type":(a,b)=>a["gacha_type"]-b["gacha_type"],
	"item_type":(a,b)=>a["item_type"].localeCompare(b["item_type"]),
	"name":(a,b)=>a["name"].localeCompare(b["name"]),
	"rank_type":(a,b)=>a["rank_type"]-b["rank_type"],
	//because timestamp does not distinguish order within a 10 pull,
	//sort by internal id instead
	//dev note: consider stripping out id and replacing with order of pulls instead
	//that would require additional work to show absolute order across banners (sort by both timestamp and order)
	"time":(a,b)=>a["id"]-b["id"],
}
const columnNameToInternal = {
	"Banner":"gacha_type",
	"Type":"item_type",
	"Name":"name",
	"Rarity":"rank_type",
	"Time":"time",
}

function bannerLookup(code, time){
	return bannerCode[code];
	//future: can look up specific banners based on time
}

async function readFile(file){
	g.file = await file.text();
	g.status = "done";
}

async function extractResponses(){
	if(!g.file) return;
	let results;
	try{
		const json = JSON.parse(g.file);
		if(json?.log?.entries){
			results = readHar(json);
		}
		else throw new Error();
	}
	catch(e) {
		results = readCsv(g.file);
	}
	g.gachaList = results;
	g.gachaList.sort(sortFunction);
}

function displayTable(){
	const table = document.getElementById("table");
	let tbody = document.createElement("tbody");
	table.removeChild(table.children[1]);
	table.append(tbody);
	for(let pull of g.gachaList){
		const row = document.createElement("tr");
		const cells = [
			document.createElement("td"),
			document.createElement("td"),
			document.createElement("td"),
			document.createElement("td"),
			document.createElement("td"),
			// document.createElement("td"),
			// document.createElement("td"),
			// document.createElement("td"),
			// document.createElement("td"),
			// document.createElement("td"),
		];
		let banner = pull["gacha_type"];
		let type = pull["item_type"];
		let name = pull["name"];
		let rarity = pull["rank_type"];
		let time = pull["time"];
		banner = bannerLookup(banner,time);
		cells[0].textContent = banner;
		cells[1].textContent = type;
		cells[2].textContent = name;
		cells[3].textContent = rarity;
		cells[4].textContent = time;
		// cells[5].textContent = pull["count"];
		// cells[6].textContent = pull["id"];
		// cells[7].textContent = pull["item_id"];
		// cells[8].textContent = pull["lang"];
		// cells[9].textContent = pull["uid"];
		for(const c of cells){
			row.append(c);
		}
		tbody.append(row);
	}
}

function sortFunction(a,b){
	let comparison = 0;
	for(const rule of columnOrder){
		comparison = comparators[rule.col](a,b) * rule.asc;
		if(comparison !== 0) break;
	}
	return comparison;
}

function reorderCols(col){
	let asc = 1;
	for(let i = 0; i < columnOrder.length; i++){
		if(columnOrder[i].col === col){
			asc = columnOrder[i].asc * -1;
			columnOrder.splice(i,1);
			break;
		}
	}
	columnOrder.unshift({"col": col, "asc": asc});
	g.gachaList.sort(sortFunction);
	displayTable();
}

document.getElementById("filein").addEventListener("change",
	function(){
		const files = (this as HTMLInputElement).files;
		if(files.length){
			if(g.status === "loading"){
				console.log("not done");
				return;
			}
			g.status = "loading";
			readFile(files[0])
				.then(()=>extractResponses())
				.then(()=>displayTable())
				.catch(err => console.error(err));
		}
	}
);

document.getElementById("tocsv").onclick = function(){
	if(g.gachaList?.length){
		let data = g.gachaList.map(e => [
			e.count,
			e.gacha_type,
			e.id,
			e.item_id,
			e.item_type,
			e.lang,
			e.name,
			e.rank_type,
			e.time,
			e.uid,
		].join(","));
		let csv = data.join("\n");
		(function download(filename, text) {
			var element = document.createElement('a');
			element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
			element.setAttribute('download', filename);
			document.body.appendChild(element);
			element.click();
			document.body.removeChild(element);
		})("out.csv", csv);
	}
};

for(const columnHeader of document.getElementById("table_header").children){
	columnHeader.addEventListener("click",function(){
		if(g.gachaList === null) return;
		reorderCols(columnNameToInternal[this.textContent]);
	});
}

function readCsv(txt:string){
	const rows = txt.split("\n");
	const data = rows.map(e => e.split(","));
	return data.map(e => ({
		count: e[0],
		gacha_type: e[1],
		id: e[2],
		item_id: e[3],
		item_type: e[4],
		lang: e[5],
		name: e[6],
		rank_type: e[7],
		time: e[8],
		uid: e[9],
	}));
}
