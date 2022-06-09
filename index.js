const bannerCode = {
	"100":"Beginners' Wish",
	"200":"Wanderlust Invocation",
	"301":"Character Event Wish",
	"302":"Epitome Invocation",
};
let data = null;
let status = "done";
let gachaList = null;

function bannerLookup(code, time){
	return bannerCode[code];
	//future: can look up specific banners based on time
}

async function readFile(file){
	let t = await file.text();
	try{
		data = JSON.parse(t);
	}
	catch(e){
		console.error(e);
	}
	finally {
		status = "done";
	}
}

async function extractResponses(){
	if(!data) return;
	let requests = data.log.entries;
	requests = requests.filter(e=>
		e.request.url.startsWith("https://hk4e-api-os.mihoyo.com/event/gacha_info/api/getGachaLog")
		&& e.response.status === 200
	);
	let responses = requests.map(e => JSON.parse(e.response.content.text));
	let results = [];
	responses.map(e => e.data.list)
		.forEach(list => list.forEach(e =>results.push(e)));
	gachaList = results;
}

function viewData(){
	const table = document.getElementById("table");
	let tbody = document.createElement("tbody");
	table.removeChild(table.children[1]);
	table.append(tbody);
	for(let pull of gachaList){
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

document.getElementById("filein").addEventListener("change",
	function(){
		const files = this.files;
		if(files.length){
			if(status === "loading"){
				console.log("not done");
				return;
			}
			status = "loading";
			readFile(files[0])
				.then(()=>extractResponses())
				.then(()=>viewData());
		}
	}
);