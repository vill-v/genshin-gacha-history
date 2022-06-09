import {Pull_s, readHar} from "./har-reader.js";

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
const gachaItemTypeToCss = {
	"Character":"ch",
	"Weapon":"wp"
}
const gachaItemRarityToCss = {
	"3":"r3",
	"4":"r4",
	"5":"r5",
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
	updateGachaList(results);
}

function updateGachaList(newPulls:Pull_s[]){
	const prevCount = g.gachaList?.length || 0;
	if(g.gachaList?.length){
		if(newPulls?.[0]?.uid !== g.gachaList[0].uid){
			console.warn(`input uid does not match current data stored ${newPulls?.[0]?.uid}/${g.gachaList[0].uid}`);
			return;
		}
		for(let p of newPulls){
			if (g.gachaList.find(e => e.id === p.id)){
				continue;
			}
			g.gachaList.push(p);
		}
		g.gachaList.sort(sortFunction);
	} else {
		g.gachaList = newPulls;
	}
	console.log(`updated pull data with ${g.gachaList.length - prevCount}/${newPulls.length} additional pulls`);
	let min = null;
	let minTime = null;
	let max = null;
	let maxTime = null;
	for(let p of newPulls){
		if(min === null || min > p.id){
			min = p.id;
			minTime = p.time;
		}
		if(max === null || max < p.id){
			max = p.id;
			maxTime = p.time;
		}
	}
	console.log(`added data ranging from ${minTime} to ${maxTime}`);
}

function displayTable(){
	const table = document.getElementById("table");
	let tbody = document.createElement("tbody");
	table.removeChild(table.children[1]);
	table.append(tbody);
	if(!g.gachaList?.length){
		return;
	}
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

function renderView(banner:keyof typeof bannerCode | null){
	if(banner === null){
		document.getElementById("banner-100").innerHTML = "";
		document.getElementById("banner-200").innerHTML = "";
		document.getElementById("banner-301").innerHTML = "";
		document.getElementById("banner-302").innerHTML = "";
		document.getElementById("view").classList.add("hide");
		return;
	}
	if(!g.gachaList?.length){
		console.warn("no data to render");
		return;
	}
	// const bannerName = bannerCode[banner];
	const data:Pull_s[] = g.gachaList.filter(e => e.gacha_type === banner).sort(
		(a,b)=>Number(BigInt(a.id)-BigInt(b.id)));
	const table = prepareTable("Count","Pity4","Pity5","Item","Date");
	let tbody = document.createElement("tbody");
	table.append(tbody);
	let count = 0;
	let pity4 = 0;
	let pity5 = 0;
	for(let pull of data){
		count++;
		pity4++;
		pity5++;
		const row = document.createElement("tr");
		const cells = [
			document.createElement("td"),
			document.createElement("td"),
			document.createElement("td"),
			document.createElement("td"),
			document.createElement("td"),
		];
		cells[0].textContent = ""+count;
		cells[1].textContent = ""+pity4;
		cells[2].textContent = ""+pity5;
		cells[3].textContent = pull["name"];
		cells[4].textContent = pull["time"];
		cells[3].classList.add(gachaItemTypeToCss[pull["item_type"]]);
		cells[3].classList.add(gachaItemRarityToCss[pull["rank_type"]]);
		for(const c of cells){
			row.append(c);
		}
		tbody.append(row);
		if(pull["rank_type"] === "4"){
			pity4 = 0;
		}
		if(pull["rank_type"] === "5"){
			pity5 = 0;
		}
	}
	const container = document.getElementById("banner-"+banner);
	container.innerHTML = "";
	container.append(table);
	applyViewFilters();
}

function applyViewFilters(){
	const visibleView = [...document.getElementById("banner-content").children].filter(e => !e.classList.contains("hide"));
	if(!visibleView.length){
		return;
	}
	const currentView = visibleView[0];
	//show all rows
	currentView.querySelectorAll("tbody > tr").forEach(e=>e.classList.remove("hide"));
	const threeStars = currentView.querySelectorAll("tbody td.r3");
	const fourStars = currentView.querySelectorAll("tbody td.r4");
	if((document.getElementById("hide-3s") as HTMLInputElement).checked){
		for(const e of threeStars){
			e.parentElement.classList.add("hide");
		}
	}
	if((document.getElementById("hide-4s") as HTMLInputElement).checked){
		for(const e of fourStars){
			e.parentElement.classList.add("hide");
		}
	}
}

function prepareTable(...headers:string[]){
	const table = document.createElement("table");
	const thead = document.createElement("thead");
	const hrow = document.createElement("tr");
	for(const e of headers){
		const th = document.createElement("th");
		th.textContent = e;
		hrow.append(th);
	}
	thead.append(hrow);
	table.append(thead);
	return table;
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

document.getElementById("hide-3s").addEventListener("change",function(){
	applyViewFilters();
});

document.getElementById("hide-4s").addEventListener("change",function(){
	applyViewFilters();
});

document.getElementById("reset").onclick = function(){
	g.file = null;
	g.data = null;
	g.status = "done";
	g.gachaList = null;
	displayTable();
	renderView(null);
}

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

document.getElementById("view-formatted").onclick = function(){
	document.getElementById("view").classList.remove("hide");
	document.getElementById("raw").classList.add("hide");
}
document.getElementById("view-raw").onclick = function(){
	document.getElementById("view").classList.add("hide");
	document.getElementById("raw").classList.remove("hide");
}

function resetTabVisibility(){
	for(const e of document.getElementsByClassName("tab-selected")){
		e.classList.remove("tab-selected");
	}
	for(const e of document.getElementById("banner-content").children){
		e.classList.add("hide");
	}
}

document.getElementById("banner-tab-100").onclick = function(){
	resetTabVisibility();
	document.getElementById("banner-tab-100").classList.add("tab-selected");
	document.getElementById("banner-100").classList.remove("hide");
	renderView("100");
}
document.getElementById("banner-tab-200").onclick = function(){
	resetTabVisibility();
	document.getElementById("banner-tab-200").classList.add("tab-selected");
	document.getElementById("banner-200").classList.remove("hide");
	renderView("200");
}
document.getElementById("banner-tab-301").onclick = function(){
	resetTabVisibility();
	document.getElementById("banner-tab-301").classList.add("tab-selected");
	document.getElementById("banner-301").classList.remove("hide");
	renderView("301");
}
document.getElementById("banner-tab-302").onclick = function(){
	resetTabVisibility();
	document.getElementById("banner-tab-302").classList.add("tab-selected");
	document.getElementById("banner-302").classList.remove("hide");
	renderView("302");
}


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
