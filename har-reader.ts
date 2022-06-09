import { Har } from "har-format";

export function readHar(data:Har):Pull_s[]{
	let entries = data.log.entries;
	entries = entries.filter(e=>
		e.request.url.startsWith("https://hk4e-api-os.mihoyo.com/event/gacha_info/api/getGachaLog")
		&& e.response.status === 200
	);
	let responses = entries.map(e => JSON.parse(e.response.content.text));
	responses = responses.filter(e => e.hasOwnProperty("data") &&
		e.hasOwnProperty("message") &&
		e.hasOwnProperty("retcode")) as ApiResponse[]
	let results:Pull_s[] = [];
	let ids = new Set();
	responses.map(e => e.data.list)
		.forEach(list => list.forEach(addWithDedupe));
	return results;

	function addWithDedupe(item:Pull_s){
		if(ids.has(item.id)) return;
		ids.add(item.id);
		results.push(item);
	}
}
interface ApiResponse {
	data: ApiResponseData;
	message: "OK";
	retcode: 0;
}
interface ApiResponseData {
	list: Pull_s[];
	page: string;
	region: string;
	size: string;
	total: string;
}
export interface Pull_s{
	count: string;
	gacha_type: string;
	id: string;
	item_id: string;
	item_type: string;
	lang: string;
	name: string;
	rank_type: string;
	time: string;
	uid: string;
}
interface Pull_d{
	count: number;
	gacha_type: string;
	id: bigint;
	item_id: string;
	item_type: string;
	lang: string;
	name: string;
	rank_type: number;
	time: string;
	uid: string;
}
