import {read} from "./har-reader.js";

const bannerCode = {
	"100":"Beginners' Wish",
	"200":"Wanderlust Invocation",
	"301":"Character Event Wish",
	"302":"Epitome Invocation",
};
const g:any = {};
// @ts-ignore
window.globals = g;
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
	let t = await file.text();
	try{
		g.data = JSON.parse(t);
	}
	catch(e){
		console.error(e);
	}
	finally {
		status = "done";
	}
}

async function extractResponses(){
	if(!g.data) return;
	let results = read(g.data);
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
			if(status === "loading"){
				console.log("not done");
				return;
			}
			status = "loading";
			readFile(files[0])
				.then(()=>extractResponses())
				.then(()=>displayTable());
		}
	}
);

for(const columnHeader of document.getElementById("table_header").children){
	columnHeader.addEventListener("click",function(){
		if(g.gachaList === null) return;
		reorderCols(columnNameToInternal[this.textContent]);
	});
}
