require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// ==========================================
// CẤU HÌNH TẬP TRUNG CHO TẤT CẢ CHẾ ĐỘ CHƠI
// ==========================================
const GAME_CONFIG = {
	general: {
		messageTTL: 3 * 60 * 1000,
		afkTimeout: 30000,
	},
	normalRace: {
		duration: 300,
		wordCount: 150,
	},
	numpad: {
		duration: 90,
		wordCount: 500,
	},
	ngauHung: {
		difficulties: {
			normal: {
				id: "normal",
				name: "Bình thường",
				icon: "🟡",
				color: "#ffe600",
				roundDuration: 7,
				intermissionDuration: 3,
				totalRounds: 15,
				ratioVi: 45,
				ratioEn: 45,
				ratioNum: 10,
				hardViRate: 35,
				hardEnRate: 35,
			},
			legendary: {
				id: "legendary",
				name: "Huyền Thoại",
				icon: "👑",
				color: "#ff0055",
				roundDuration: 3.5,
				intermissionDuration: 1.5,
				totalRounds: 25,
				ratioVi: 35,
				ratioEn: 35,
				ratioNum: 30,
				hardViRate: 85,
				hardEnRate: 85,
			},
		},
	},
	sanBoss: {
		wordPoolCount: 400,
		difficulties: {
			easy: {
				id: "easy",
				name: "Dễ",
				icon: "🟢",
				color: "#00ff66",
				duration: 180,
				baseHp: 450,
				hpPerPlayer: 400,
				selfDestructTarget: 450,
				skillInterval: 16,
				shieldBasePerPlayer: 30,
				shieldDuration: 8,
				stunDuration: 4,
				shakeDuration: 5,
				fogDuration: 5,
				reverseDuration: 5,
				capslockDuration: 5,
				enabledSkills: {
					shield: true,
					capslock: false,
					shake: true,
					fog: false,
					reverse: false,
				},
			},
			normal: {
				id: "normal",
				name: "Bình thường",
				icon: "🟡",
				color: "#ffe600",
				duration: 150,
				baseHp: 550,
				hpPerPlayer: 500,
				selfDestructTarget: 450,
				skillInterval: 14,
				shieldBasePerPlayer: 40,
				shieldDuration: 6,
				stunDuration: 3,
				shakeDuration: 5,
				fogDuration: 5,
				reverseDuration: 5,
				capslockDuration: 6,
				enabledSkills: {
					shield: true,
					capslock: true,
					shake: true,
					fog: true,
					reverse: false,
				},
			},
			hard: {
				id: "hard",
				name: "Khó",
				icon: "🔴",
				color: "#ff7700",
				duration: 130,
				baseHp: 650,
				hpPerPlayer: 600,
				selfDestructTarget: 500,
				skillInterval: 12,
				shieldBasePerPlayer: 50,
				shieldDuration: 5,
				stunDuration: 2.5,
				shakeDuration: 6,
				fogDuration: 6,
				reverseDuration: 5,
				capslockDuration: 7,
				enabledSkills: {
					shield: true,
					capslock: true,
					shake: true,
					fog: true,
					reverse: true,
				},
			},
			hell: {
				id: "hell",
				name: "Địa ngục",
				icon: "💀",
				color: "#ff0055",
				duration: 120,
				baseHp: 750,
				hpPerPlayer: 700,
				selfDestructTarget: 550,
				skillInterval: 10,
				shieldBasePerPlayer: 60,
				shieldDuration: 5,
				stunDuration: 2,
				shakeDuration: 7,
				fogDuration: 7,
				reverseDuration: 6,
				capslockDuration: 8,
				enabledSkills: {
					shield: true,
					capslock: true,
					shake: true,
					fog: true,
					reverse: true,
				},
			},
		},
	},
};

app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// 1. TỪ VỰNG & TỰ ĐỘNG SINH "VI_NODAU"
// ==========================================
function removeVietnameseTones(str) {
	return str
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/đ/g, "d")
		.replace(/Đ/g, "D");
}

const BIG_WORD_BANKS = {
	vi_dau: {
		// ~650 TỪ TIẾNG VIỆT CƠ BẢN / DỄ (CHUẨN ĐẶT DẤU BỘ GÕ HIỆN ĐẠI)
		easy: [
			// Thiên nhiên, thời tiết & thời gian
			"ngày",
			"đêm",
			"mưa",
			"nắng",
			"gió",
			"mây",
			"sông",
			"núi",
			"biển",
			"rừng",
			"trời",
			"đất",
			"lửa",
			"nước",
			"cát",
			"đá",
			"sỏi",
			"bùn",
			"tro",
			"khói",
			"bụi",
			"sao",
			"trăng",
			"sáng",
			"trưa",
			"chiều",
			"tối",
			"khuya",
			"hôm",
			"mai",
			"nay",
			"sớm",
			"muộn",
			"lúc",
			"giờ",
			"phút",
			"giây",
			"tuần",
			"tháng",
			"năm",
			"mùa",
			"xuân",
			"hè",
			"thu",
			"đông",
			"bão",
			"giông",
			"sấm",
			"chớp",
			"sương",
			"tuyết",
			"rét",
			"lạnh",
			"nóng",
			"ấm",
			"mát",
			"ẩm",
			"khô",
			"hanh",
			"nguồn",
			"suối",
			"thác",
			"khe",
			"lạch",
			"ao",
			"hồ",
			"đầm",
			"vực",
			"cồn",
			"bãi",
			"bờ",
			"đảo",
			"vịnh",
			"hang",
			"động",
			"rãnh",
			"kênh",
			"mương",
			"đồi",
			"dốc",

			// Con người, gia đình, đại từ
			"ông",
			"bà",
			"cha",
			"mẹ",
			"ba",
			"má",
			"anh",
			"chị",
			"em",
			"con",
			"cháu",
			"chắt",
			"chú",
			"bác",
			"cô",
			"dì",
			"thím",
			"cậu",
			"mợ",
			"dượng",
			"thầy",
			"bạn",
			"trò",
			"khách",
			"chủ",
			"người",
			"trai",
			"gái",
			"nam",
			"nữ",
			"già",
			"trẻ",
			"bé",
			"cụ",
			"chàng",
			"nàng",
			"tôi",
			"ta",
			"mình",
			"tớ",
			"cậu",
			"họ",
			"chúng",
			"ai",
			"kẻ",
			"hàng",
			"xóm",
			"làng",
			"phố",
			"thôn",
			"ấp",
			"bản",
			"quê",
			"quán",
			"nhà",
			"dân",
			"tộc",

			// Cơ thể con người
			"đầu",
			"tóc",
			"tai",
			"mắt",
			"mũi",
			"miệng",
			"môi",
			"răng",
			"lưỡi",
			"cằm",
			"má",
			"trán",
			"cổ",
			"gáy",
			"vai",
			"ngực",
			"lưng",
			"bụng",
			"rốn",
			"eo",
			"hông",
			"tay",
			"chân",
			"ngón",
			"móng",
			"nách",
			"khớp",
			"gối",
			"gót",
			"da",
			"thịt",
			"xương",
			"máu",
			"tim",
			"gan",
			"phổi",
			"thận",
			"ruột",
			"não",
			"mày",
			"mi",
			"râu",
			"lông",
			"gân",
			"bắp",
			"mặt",
			"thân",
			"vóc",
			"dáng",
			"tiếng",

			// Động vật
			"chó",
			"mèo",
			"gà",
			"vịt",
			"ngan",
			"ngỗng",
			"bồ",
			"câu",
			"chim",
			"cá",
			"tôm",
			"cua",
			"ốc",
			"nghêu",
			"sò",
			"hến",
			"mực",
			"lươn",
			"trạch",
			"ếch",
			"nhái",
			"cóc",
			"heo",
			"lợn",
			"bò",
			"trâu",
			"ngựa",
			"dê",
			"cừu",
			"hươu",
			"nai",
			"voi",
			"hổ",
			"cọp",
			"báo",
			"gấu",
			"khỉ",
			"vượn",
			"sói",
			"cáo",
			"chồn",
			"thỏ",
			"chuột",
			"sóc",
			"nhím",
			"rắn",
			"trăn",
			"rùa",
			"ba",
			"ong",
			"bướm",
			"kiến",
			"gián",
			"muỗi",
			"ruồi",
			"nhện",
			"dế",
			"ve",
			"tằm",
			"sâu",
			"giun",
			"sên",
			"đỉa",
			"bọ",
			"mối",
			"cào",
			"châu",
			"nghé",
			"bê",

			// Cây cối, rau củ, quả, thực phẩm
			"cây",
			"hoa",
			"lá",
			"cành",
			"gốc",
			"rễ",
			"thân",
			"vỏ",
			"búp",
			"chồi",
			"mầm",
			"nụ",
			"quả",
			"trái",
			"hạt",
			"hột",
			"cùi",
			"xơ",
			"gai",
			"rơm",
			"rạ",
			"thóc",
			"lúa",
			"gạo",
			"nếp",
			"tẻ",
			"ngô",
			"bắp",
			"khoai",
			"sắn",
			"đậu",
			"đỗ",
			"lạc",
			"vừng",
			"mè",
			"tiêu",
			"tỏi",
			"hành",
			"ớt",
			"gừng",
			"sả",
			"chanh",
			"quất",
			"cam",
			"quýt",
			"bưởi",
			"xoài",
			"ổi",
			"mít",
			"na",
			"chuối",
			"lê",
			"đào",
			"mận",
			"dưa",
			"hấu",
			"sầu",
			"bơ",
			"dừa",
			"vải",
			"nhãn",
			"me",
			"táo",
			"dâu",
			"nho",
			"bí",
			"bầu",
			"mướp",
			"cà",
			"muống",
			"ngót",
			"cải",
			"dền",
			"ngải",
			"răm",
			"sen",
			"súng",
			"cúc",
			"hồng",
			"mai",
			"lan",
			"huệ",
			"nhài",
			"tre",
			"trúc",
			"nứa",
			"thông",
			"rong",
			"rêu",
			"cỏ",
			"cơm",
			"cháo",
			"canh",
			"súp",
			"bún",
			"phở",
			"mì",
			"miến",
			"bánh",
			"kẹo",
			"muối",
			"đường",
			"mật",
			"mía",
			"sữa",
			"trà",
			"rượu",
			"bia",
			"mỡ",
			"dầu",

			// Đồ vật, nhà cửa, dụng cụ
			"nhà",
			"cửa",
			"sân",
			"vườn",
			"ngõ",
			"tường",
			"vách",
			"mái",
			"cột",
			"kèo",
			"sàn",
			"thềm",
			"bậc",
			"khóa",
			"bàn",
			"ghế",
			"giường",
			"tủ",
			"chiếu",
			"chăn",
			"màn",
			"gối",
			"nệm",
			"gương",
			"lược",
			"đèn",
			"nến",
			"quạt",
			"nồi",
			"xoong",
			"chảo",
			"bát",
			"đĩa",
			"tô",
			"chén",
			"cốc",
			"ly",
			"thìa",
			"muỗng",
			"đũa",
			"dao",
			"kéo",
			"thớt",
			"rổ",
			"rá",
			"chậu",
			"xô",
			"thùng",
			"can",
			"hũ",
			"lọ",
			"bình",
			"chai",
			"bao",
			"túi",
			"ví",
			"cặp",
			"áo",
			"quần",
			"váy",
			"khăn",
			"mũ",
			"nón",
			"giày",
			"dép",
			"ủng",
			"tất",
			"găng",
			"kim",
			"chỉ",
			"thước",
			"bút",
			"mực",
			"phấn",
			"bảng",
			"sách",
			"vở",
			"giấy",
			"tranh",
			"ảnh",
			"báo",
			"đài",
			"chuông",
			"cờ",
			"trống",
			"đàn",
			"sáo",
			"kèn",
			"gậy",
			"cuốc",
			"xẻng",
			"liềm",
			"cày",
			"bừa",
			"đinh",
			"búa",
			"kìm",
			"cưa",
			"đục",
			"thang",
			"dây",
			"thừng",
			"xích",
			"xe",
			"tàu",
			"thuyền",
			"bè",
			"phà",
			"ga",
			"cầu",

			// Hành động, động từ
			"đi",
			"đến",
			"về",
			"ra",
			"vào",
			"lên",
			"xuống",
			"qua",
			"lại",
			"chạy",
			"nhảy",
			"bước",
			"đứng",
			"ngồi",
			"nằm",
			"bò",
			"trườn",
			"bay",
			"lượn",
			"bơi",
			"lặn",
			"trèo",
			"leo",
			"trượt",
			"ngã",
			"té",
			"bổ",
			"nhào",
			"ăn",
			"uống",
			"nhai",
			"nuốt",
			"cắn",
			"ngậm",
			"mút",
			"liếm",
			"húp",
			"nếm",
			"ngủ",
			"thức",
			"mơ",
			"dậy",
			"tắm",
			"giặt",
			"gội",
			"rửa",
			"lau",
			"chùi",
			"quét",
			"dọn",
			"xem",
			"nhìn",
			"ngắm",
			"trông",
			"dòm",
			"ngó",
			"thấy",
			"nghe",
			"ngửi",
			"hít",
			"thở",
			"nói",
			"cười",
			"khóc",
			"kêu",
			"gào",
			"la",
			"hét",
			"hát",
			"múa",
			"đọc",
			"viết",
			"vẽ",
			"may",
			"vá",
			"đan",
			"thêu",
			"gọt",
			"tỉa",
			"chặt",
			"chém",
			"cắt",
			"xẻ",
			"mổ",
			"xé",
			"bẻ",
			"vặn",
			"xoay",
			"kéo",
			"đẩy",
			"giật",
			"lôi",
			"bê",
			"vác",
			"khiêng",
			"gánh",
			"xách",
			"ôm",
			"bế",
			"cõng",
			"dắt",
			"dẫn",
			"đưa",
			"đón",
			"tiễn",
			"chào",
			"hỏi",
			"mời",
			"xin",
			"cho",
			"biếu",
			"tặng",
			"nhận",
			"lấy",
			"giữ",
			"giấu",
			"cất",
			"bỏ",
			"vứt",
			"quăng",
			"ném",
			"đập",
			"đánh",
			"đấm",
			"đá",
			"tát",
			"cào",
			"cấu",
			"phạt",
			"khen",
			"chê",
			"yêu",
			"ghét",
			"giận",
			"hờn",
			"thương",
			"nhớ",
			"mong",
			"chờ",
			"tìm",
			"kiếm",
			"gặp",
			"quên",
			"hiểu",
			"biết",
			"học",
			"dạy",
			"răn",
			"khuyên",
			"hẹn",
			"hứa",
			"ước",
			"muốn",
			"cần",
			"mua",
			"bán",
			"đổi",
			"trả",
			"vay",
			"mượn",
			"tiêu",
			"đếm",
			"tính",
			"đo",
			"cân",
			"đong",
			"xây",
			"dựng",
			"đắp",
			"đào",
			"bới",
			"cuốc",
			"gieo",
			"trồng",
			"cấy",
			"gặt",
			"hái",
			"tưới",
			"bón",
			"chăm",
			"nuôi",
			"dưỡng",
			"cứu",
			"giúp",
			"đỡ",
			"nhường",
			"nhịn",
			"tha",
			"chịu",
			"kìm",
			"ngăn",
			"chặn",
			"vây",
			"bắt",
			"thả",
			"trốn",
			"thoát",
			"đuổi",
			"theo",
			"kịp",

			// Tính từ, trạng thái & màu sắc
			"tốt",
			"xấu",
			"đẹp",
			"xinh",
			"tươi",
			"héo",
			"sạch",
			"bẩn",
			"thơm",
			"thối",
			"khét",
			"ngọt",
			"mặn",
			"chua",
			"cay",
			"đắng",
			"chát",
			"bùi",
			"béo",
			"ngon",
			"dở",
			"đậm",
			"nhạt",
			"nồng",
			"gắt",
			"cao",
			"thấp",
			"dài",
			"ngắn",
			"rộng",
			"hẹp",
			"to",
			"nhỏ",
			"bé",
			"lớn",
			"dày",
			"mỏng",
			"nặng",
			"nhẹ",
			"cứng",
			"mềm",
			"dẻo",
			"dai",
			"giòn",
			"xốp",
			"nhẵn",
			"ráp",
			"trơn",
			"thẳng",
			"cong",
			"tròn",
			"vuông",
			"méo",
			"dẹp",
			"nhọn",
			"tù",
			"sắc",
			"bén",
			"cùn",
			"nhanh",
			"chậm",
			"mau",
			"lẹ",
			"gấp",
			"đúng",
			"sai",
			"dễ",
			"khó",
			"tiện",
			"lợi",
			"vui",
			"buồn",
			"sướng",
			"khổ",
			"đau",
			"xót",
			"rát",
			"ngứa",
			"tê",
			"mỏi",
			"nhức",
			"mệt",
			"khỏe",
			"yếu",
			"lành",
			"rách",
			"vỡ",
			"nát",
			"đầy",
			"vơi",
			"cạn",
			"rỗng",
			"chật",
			"tối",
			"sáng",
			"mờ",
			"rõ",
			"trắng",
			"đen",
			"đỏ",
			"vàng",
			"xanh",
			"tím",
			"hồng",
			"nâu",
			"xám",
			"bạc",
			"giàu",
			"nghèo",
			"sang",
			"hèn",
			"quý",
			"rẻ",
			"đắt",
			"thật",
			"giả",
			"cũ",
			"mới",
			"lạ",
			"quen",

			// Số từ & liên từ
			"một",
			"hai",
			"ba",
			"bốn",
			"năm",
			"sáu",
			"bảy",
			"tám",
			"chín",
			"mười",
			"trăm",
			"nghìn",
			"vạn",
			"triệu",
			"tỉ",
			"nửa",
			"đôi",
			"cặp",
			"vài",
			"dăm",
			"và",
			"với",
			"cùng",
			"hay",
			"hoặc",
			"nhưng",
			"mà",
			"vì",
			"bởi",
			"do",
			"nên",
			"thì",
			"nếu",
			"giá",
			"dẫu",
			"dù",
			"tuy",
			"rằng",
			"là",
			"để",
		],

		// 150 TỪ TIẾNG VIỆT NÂNG CAO / KHÓ (CHUẨN ĐẶT DẤU BỘ GÕ HIỆN ĐẠI)
		hard: [
			"khoảnh",
			"nghiêng",
			"khuếch",
			"khuỵu",
			"ngoéo",
			"thuở",
			"ngoằn",
			"ngoèo",
			"nghiến",
			"nguyện",
			"truyền",
			"khuyến",
			"chuyện",
			"quyển",
			"quỷ",
			"nghễu",
			"nghiễu",
			"soạn",
			"duyệt",
			"chuộng",
			"hoảng",
			"khoảng",
			"nghèo",
			"xoắn",
			"ngoắc",
			"khoác",
			"hoắt",
			"hoẵng",
			"thuần",
			"khuần",
			"ngoài",
			"quệt",
			"nghiêm",
			"nghiệm",
			"nghiệp",
			"nguyễn",
			"quyết",
			"quyền",
			"quýnh",
			"quỳnh",
			"quyến",
			"quyện",
			"uyển",
			"uyết",
			"huyễn",
			"huyền",
			"huyện",
			"chuyển",
			"chuyến",
			"chuyễn",
			"tuyển",
			"tuyến",
			"tuyệt",
			"tuyên",
			"duyên",
			"khuyết",
			"khuyên",
			"khuyển",
			"khuya",
			"khuây",
			"khuất",
			"khuẩn",
			"khuôn",
			"nguệch",
			"nguẩy",
			"nguyệt",
			"nguyền",
			"nghịch",
			"nghiệt",
			"nghiễm",
			"nghĩa",
			"nghễnh",
			"nghệch",
			"nghênh",
			"ngoảnh",
			"ngoặt",
			"ngoẵng",
			"ngoẹo",
			"ngoét",
			"xoẹt",
			"xoạc",
			"xoạch",
			"quạnh",
			"quẫy",
			"khuỷu",
			"khuynh",
			"khuấy",
			"khoắng",
			"khỏe",
			"loãng",
			"ngoạm",
			"loạng",
			"choạng",
			"loằng",
			"khoẵng",
			"toác",
			"thoảng",
			"xoang",
			"quăng",
			"quắc",
			"xoặc",
			"toát",
			"thoát",
			"thoắt",
			"khoắt",
			"choắt",
			"nhuộm",
			"suộm",
			"nguấy",
			"quấy",
			"loay",
			"hoay",
			"ngoáy",
			"khoáy",
			"xoay",
			"toay",
			"khoeo",
			"khoèo",
			"quỵt",
			"trĩu",
			"suyễn",
			"hoạnh",
			"quánh",
			"chễm",
			"chệ",
			"nghẽn",
			"ngẫm",
			"nghĩ",
			"bẽn",
			"lẽn",
			"nũng",
			"nịu",
			"nguội",
			"chuỗi",
			"nguẩn",
			"quẩn",
			"huých",
			"uỵch",
			"huỵch",
			"quẫy",
			"nghẹn",
			"xòe",
			"ngoe",
			"xuệ",
			"lũy",
			"thủy",
			"túy",
			"nhuần",
			"chuẩn",
			"xuất",
		],
	},
	en: {
		easy: [
			"cat",
			"dog",
			"sun",
			"moon",
			"star",
			"tree",
			"book",
			"pen",
			"desk",
			"fish",
			"fast",
			"good",
			"apple",
			"orange",
			"grape",
			"peach",
			"pear",
			"lemon",
			"melon",
			"berry",
			"bread",
			"rice",
			"cake",
			"soup",
			"milk",
			"water",
			"juice",
			"coffee",
			"tea",
			"sugar",
			"salt",
			"egg",
			"meat",
			"beef",
			"pork",
			"chicken",
			"duck",
			"horse",
			"sheep",
			"goat",
			"mouse",
			"house",
			"home",
			"room",
			"door",
			"wall",
			"floor",
			"roof",
			"bed",
			"chair",
			"table",
			"school",
			"class",
			"teacher",
			"student",
			"friend",
			"family",
			"mother",
			"father",
			"sister",
			"brother",
			"baby",
			"child",
			"boy",
			"girl",
			"man",
			"woman",
			"king",
			"queen",
			"name",
			"face",
			"hand",
			"head",
			"hair",
			"eye",
			"ear",
			"nose",
			"mouth",
			"foot",
			"leg",
			"arm",
			"car",
			"bus",
			"train",
			"boat",
			"road",
			"street",
			"park",
			"shop",
			"store",
			"farm",
			"red",
			"blue",
			"green",
			"white",
			"black",
			"brown",
			"pink",
			"gray",
			"round",
			"square",
			"big",
			"small",
			"long",
			"short",
			"high",
			"low",
			"hot",
			"cold",
			"warm",
			"cool",
		],
		hard: [
			"rhythm",
			"queue",
			"knapsack",
			"quizzical",
			"puzzling",
			"knowledge",
			"strength",
			"synergy",
			"awkward",
			"beautiful",
			"bizarre",
			"brilliant",
			"cautious",
			"curious",
			"dangerous",
			"delicate",
			"difficult",
			"efficient",
			"enormous",
			"excellent",
			"fascinating",
			"fortunate",
			"generous",
			"gorgeous",
			"grateful",
			"harmonious",
			"impressive",
			"incredible",
			"independent",
			"intelligent",
			"mysterious",
			"necessary",
			"obvious",
			"optimistic",
			"particular",
			"powerful",
			"precious",
			"previous",
			"reasonable",
			"remarkable",
			"significant",
			"spectacular",
			"successful",
			"surprising",
			"technical",
			"thoughtful",
			"traditional",
			"unusual",
			"valuable",
			"wonderful",
			"adventure",
			"challenge",
			"experience",
			"language",
			"question",
			"throughout",
		],
	},
};

BIG_WORD_BANKS.vi_nodau = {
	easy: BIG_WORD_BANKS.vi_dau.easy.map(removeVietnameseTones),
	hard: BIG_WORD_BANKS.vi_dau.hard.map(removeVietnameseTones),
};

function generateWords(lang, count, difficulty = "normal") {
	if (lang === "san_boss") {
		const total = count || GAME_CONFIG.sanBoss.wordPoolCount;
		const viPool = [...BIG_WORD_BANKS.vi_nodau.easy, ...BIG_WORD_BANKS.vi_nodau.hard];
		const enPool = [...BIG_WORD_BANKS.en.easy, ...BIG_WORD_BANKS.en.hard];
		return Array.from({ length: total }, () => {
			const rand = Math.random();
			if (rand < 0.2) return enPool[Math.floor(Math.random() * enPool.length)];
			if (rand < 0.6) return viPool[Math.floor(Math.random() * viPool.length)];
			return Math.floor(10000 + Math.random() * 90000).toString();
		});
	}
	if (lang === "ngau_hung") {
		const nhDiff =
			GAME_CONFIG.ngauHung.difficulties[difficulty] || GAME_CONFIG.ngauHung.difficulties.normal;
		const totalRounds = count || nhDiff.totalRounds || 15;

		const ratioVi = nhDiff.ratioVi ?? 45;
		const ratioEn = nhDiff.ratioEn ?? 45;
		const ratioNum = nhDiff.ratioNum ?? 10;
		const sumRatio = Math.max(1, ratioVi + ratioEn + ratioNum);

		const hardViRate = (nhDiff.hardViRate ?? 35) / 100;
		const hardEnRate = (nhDiff.hardEnRate ?? 35) / 100;

		return Array.from({ length: totalRounds }, () => {
			const rand = Math.random() * sumRatio;
			if (rand < ratioVi) {
				const isHard = Math.random() < hardViRate;
				const pool = isHard ? BIG_WORD_BANKS.vi_nodau.hard : BIG_WORD_BANKS.vi_nodau.easy;
				return pool[Math.floor(Math.random() * pool.length)];
			} else if (rand < ratioVi + ratioEn) {
				const isHard = Math.random() < hardEnRate;
				const pool = isHard ? BIG_WORD_BANKS.en.hard : BIG_WORD_BANKS.en.easy;
				return pool[Math.floor(Math.random() * pool.length)];
			} else {
				return Math.floor(10000 + Math.random() * 90000).toString();
			}
		});
	}
	if (lang === "numpad") {
		const total = count || GAME_CONFIG.numpad.wordCount;
		return Array.from({ length: total }, () =>
			Math.floor(10000 + Math.random() * 90000).toString(),
		);
	}
	const bank = BIG_WORD_BANKS[lang] || BIG_WORD_BANKS.vi_dau;
	const total = count || GAME_CONFIG.normalRace.wordCount;
	return Array.from({ length: total }, () => {
		const pool = Math.random() < 0.35 ? bank.hard : bank.easy;
		return pool[Math.floor(Math.random() * pool.length)];
	});
}

// ==========================================
// 2. HIGH SCORES & TỰ ĐỘNG RESET
// ==========================================
const HIGHSCORES_FILE = path.join(__dirname, "highscores.json");
const defaultHighScores = {
	vi_dau: null,
	vi_nodau: null,
	en: null,
	numpad: null,
	ngau_hung: null,
	san_boss: null,
};
let highScores = { ...defaultHighScores };

function loadHighScores() {
	try {
		if (fs.existsSync(HIGHSCORES_FILE)) {
			highScores = {
				...defaultHighScores,
				...JSON.parse(fs.readFileSync(HIGHSCORES_FILE, "utf8")),
			};
		}
	} catch (e) {
		console.error("Lỗi load high scores:", e.message);
	}
}

function saveHighScores() {
	try {
		fs.writeFileSync(HIGHSCORES_FILE, JSON.stringify(highScores, null, 2), "utf8");
	} catch (e) {
		console.error("Lỗi save high scores:", e.message);
	}
}

function scheduleDailyReset() {
	const now = new Date();
	const gmt7Ms = now.getTime() + (now.getTimezoneOffset() + 420) * 60000;
	const nextReset = new Date(gmt7Ms);
	nextReset.setHours(24, 0, 0, 0);

	setTimeout(() => {
		highScores = { ...defaultHighScores };
		saveHighScores();
		io.emit("update_high_scores", highScores);
		scheduleDailyReset();
	}, nextReset.getTime() - gmt7Ms);
}

loadHighScores();
scheduleDailyReset();

function updateHighScoresAndBroadcast(lang, username, wpm, errors, playerCount, score = 0) {
	if (playerCount < 3) return;
	const curr = highScores[lang];
	const isNew =
		lang === "ngau_hung" || lang === "san_boss"
			? !curr || score > (curr.score || 0) || (score === (curr.score || 0) && errors < curr.errors)
			: !curr || wpm > curr.wpm || (wpm === curr.wpm && errors < curr.errors);

	if (isNew) {
		highScores[lang] = { username, wpm, score, errors, timestamp: Date.now() };
		saveHighScores();
		io.emit("update_high_scores", highScores);
	}
}

// ==========================================
// 3. TIN NHẮN CHAT
// ==========================================
const MESSAGES_FILE = path.join(__dirname, "messages.json");
let chatMessages = [];
const userChatHistory = new Map();
const mutedUsers = new Map();

function loadMessages() {
	try {
		if (fs.existsSync(MESSAGES_FILE))
			chatMessages = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf8"));
		cleanOldMessages();
	} catch (e) {
		chatMessages = [];
	}
}

function cleanOldMessages() {
	const now = Date.now();
	const initLen = chatMessages.length;
	chatMessages = chatMessages.filter((msg) => now - msg.timestamp < GAME_CONFIG.general.messageTTL);
	if (chatMessages.length !== initLen) {
		fs.writeFileSync(MESSAGES_FILE, JSON.stringify(chatMessages, null, 2), "utf8");
		io.emit("load_initial_messages", chatMessages);
	}
}

setInterval(cleanOldMessages, 10000);
loadMessages();

function checkSpamLimit(socketId) {
	const now = Date.now();
	const unmuteTime = mutedUsers.get(socketId);
	if (unmuteTime) {
		if (now < unmuteTime)
			return { allowed: false, remainingSec: Math.ceil((unmuteTime - now) / 1000) };
		mutedUsers.delete(socketId);
		userChatHistory.delete(socketId);
	}
	let history = (userChatHistory.get(socketId) || []).filter((time) => now - time < 5000);
	if (history.length >= 5) {
		mutedUsers.set(socketId, now + 5000);
		userChatHistory.delete(socketId);
		return { allowed: false, remainingSec: 5 };
	}
	history.push(now);
	userChatHistory.set(socketId, history);
	return { allowed: true };
}

// ==========================================
// 4. ADMIN & BAN USER
// ==========================================
const connectedUsers = new Map();
const bannedUsers = new Map();

function isUserBanned(socketId) {
	if (!socketId || !bannedUsers.has(socketId)) return false;
	const b = bannedUsers.get(socketId);
	if (Date.now() > b.expiresAt) {
		unbanUser(socketId);
		return false;
	}
	return true;
}

function unbanUser(socketId) {
	if (bannedUsers.has(socketId)) {
		clearTimeout(bannedUsers.get(socketId).timeoutId);
		bannedUsers.delete(socketId);
		broadcastAdminData();
	}
}

function broadcastAdminData() {
	const now = Date.now();
	const onlineList = [...connectedUsers.values()]
		.map((u) => ({
			id: u.id,
			username: u.username || "Vô danh",
			isAdmin: !!u.isAdmin,
			isBanned: u.isAdmin ? false : isUserBanned(u.id),
		}))
		.sort((a, b) => (b.isAdmin ? 1 : 0) - (a.isAdmin ? 1 : 0));

	const bannedList = [...bannedUsers.values()].map((b) => ({
		id: b.id,
		username: b.username || "Vô danh",
		bannedAt: b.bannedAt,
		expiresAt: b.expiresAt,
		remainingSec: Math.max(0, Math.ceil((b.expiresAt - now) / 1000)),
	}));

	io.sockets.sockets.forEach((s) => {
		if (s.isAdmin) {
			s.emit("admin_online_users", onlineList);
			s.emit("admin_banned_users", bannedList);
			s.emit("admin_game_config", GAME_CONFIG);
		}
	});
}

// ==========================================
// 5. PHÒNG ĐẤU & BOSS ENGINE
// ==========================================
const rooms = { en: [], vi_nodau: [], vi_dau: [], numpad: [], ngau_hung: [], san_boss: [] };
let totalOnlineUsers = 0;

function getOrCreateRoom(lang) {
	let roomList = rooms[lang] || rooms.vi_dau;
	let room = roomList.find((r) => r.state === "waiting" && r.players.length < 10);
	if (!room) {
		room = {
			id: `room_${lang}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
			lang,
			difficulty: "normal",
			state: "waiting",
			players: [],
			words: generateWords(lang, null, "normal"),
			matchInterval: null,
			matchTimeout: null,
			startTime: null,
			currentRound: 0,
			totalRounds: GAME_CONFIG.ngauHung.difficulties.normal.totalRounds,
			roundWinners: [],
			roundActive: false,
			roundTimer: null,
			roundIntermissionTimer: null,
			boss: null,
			bossSkillTimer: null,
		};
		roomList.push(room);
	}
	return room;
}

function clearRoomTimers(room) {
	clearInterval(room.matchInterval);
	clearTimeout(room.matchTimeout);
	clearTimeout(room.roundTimer);
	clearTimeout(room.roundIntermissionTimer);
	if (room.bossSkillTimer) clearInterval(room.bossSkillTimer);
	if (room.boss) {
		clearTimeout(room.boss.shieldTimer);
		clearTimeout(room.boss.stunTimer);
		clearTimeout(room.boss.capsLockTimer);
	}
}

function checkMatchCompletion(room) {
	if (room.lang === "ngau_hung") return;
	const finished = room.players.filter((p) => p.isFinished || p.isSurrendered || p.isDisconnected);
	if (finished.length >= room.players.length) finishMatch(room);
}

function handlePlayerSelfDestruct(room, targetPlayer, reasonText = "đầu hàng") {
	if (!room || room.lang !== "san_boss" || room.state !== "playing" || !room.boss || !targetPlayer)
		return;
	if (targetPlayer.hasSelfDestructed) return;
	targetPlayer.hasSelfDestructed = true;

	const otherActivePlayers = room.players.filter(
		(p) => p.id !== targetPlayer.id && !p.isSurrendered && !p.isDisconnected && !p.isAFK,
	);
	if (otherActivePlayers.length === 0) return;

	const selfDestructTarget = room.boss.selfDestructTarget || 450;
	const priorDmg = targetPlayer.score || targetPlayer.correctChars || 0;
	const selfDestructDmg = priorDmg < selfDestructTarget ? selfDestructTarget - priorDmg : 0;

	if (selfDestructDmg > 0) {
		let remainingDmg = selfDestructDmg;
		if (room.boss.isShieldActive && room.boss.shield > 0) {
			if (room.boss.shield >= remainingDmg) {
				room.boss.shield -= remainingDmg;
				remainingDmg = 0;
			} else {
				remainingDmg -= room.boss.shield;
				room.boss.shield = 0;
				room.boss.isShieldActive = false;
				room.boss.isStunned = true;
				clearTimeout(room.boss.shieldTimer);

				io.to(room.id).emit("boss_shield_broken", {
					stunDuration: room.boss.stunDuration,
					message: `⚡ GIÁP ĐÃ VỠ! Boss bị Choáng ${room.boss.stunDuration}s (Nhận x1.5 Sát thương)!`,
				});
			}
		}

		if (remainingDmg > 0) {
			room.boss.hp = Math.max(0, room.boss.hp - remainingDmg);
		}
	}

	io.to(room.id).emit("boss_self_destruct_notice", {
		username: targetPlayer.username,
		damage: selfDestructDmg,
		reason: reasonText,
		message: `💥 ${targetPlayer.username} (${reasonText}) đã tự bạo và lao vào Boss gây +${selfDestructDmg} sát thương!`,
	});

	io.to(room.id).emit("boss_hp_update", {
		hp: room.boss.hp,
		maxHp: room.boss.maxHp,
		shield: room.boss.shield || 0,
		maxShield: room.boss.maxShield || 0,
		isShieldActive: room.boss.isShieldActive,
		isStunned: room.boss.isStunned,
		players: room.players,
	});

	if (room.boss.hp <= 0) {
		room.boss.hp = 0;
		finishMatch(room);
	}
}

function startNgauHungRound(room) {
	if (room.state !== "playing") return;
	if (++room.currentRound > room.totalRounds) return finishMatch(room);

	const nhDiff =
		GAME_CONFIG.ngauHung.difficulties[room.difficulty] || GAME_CONFIG.ngauHung.difficulties.normal;
	const roundDur = nhDiff.roundDuration || 7;

	room.roundWinners = [];
	room.roundActive = true;
	io.to(room.id).emit("ngau_hung_new_round", {
		round: room.currentRound,
		totalRounds: room.totalRounds,
		targetWord: room.words[room.currentRound - 1],
		duration: roundDur,
	});

	clearTimeout(room.roundTimer);
	room.roundTimer = setTimeout(() => endNgauHungRound(room), roundDur * 1000);
}

function endNgauHungRound(room) {
	if (!room.roundActive || room.state !== "playing") return;
	room.roundActive = false;
	clearTimeout(room.roundTimer);

	const nhDiff =
		GAME_CONFIG.ngauHung.difficulties[room.difficulty] || GAME_CONFIG.ngauHung.difficulties.normal;
	const interDur = nhDiff.intermissionDuration || 3;

	const roundProgress = Math.round((room.currentRound / room.totalRounds) * 100);
	room.players.forEach((p) => {
		if (!p.isSurrendered && !p.isDisconnected && !p.isAFK) p.progress = roundProgress;
	});

	io.to(room.id).emit("race_update", room.players);
	io.to(room.id).emit("ngau_hung_round_ended", {
		round: room.currentRound,
		roundWinners: room.roundWinners,
		players: room.players,
	});

	if (room.currentRound >= room.totalRounds) {
		setTimeout(() => finishMatch(room), 1500);
	} else {
		io.to(room.id).emit("ngau_hung_intermission", { duration: interDur });
		clearTimeout(room.roundIntermissionTimer);
		room.roundIntermissionTimer = setTimeout(() => startNgauHungRound(room), interDur * 1000);
	}
}

function startBossSkillLoop(room) {
	if (room.bossSkillTimer) clearInterval(room.bossSkillTimer);
	const intervalMs = (room.boss.skillInterval || 14) * 1000;

	room.bossSkillTimer = setInterval(() => {
		if (room.state !== "playing" || !room.boss || room.boss.hp <= 0) {
			return clearInterval(room.bossSkillTimer);
		}
		if (room.boss.isStunned || room.boss.isShieldActive) return;

		const enabledSkillsMap = room.boss.enabledSkills || {};
		const activeSkills = Object.keys(enabledSkillsMap).filter((k) => enabledSkillsMap[k]);
		if (activeSkills.length === 0) return;

		const skill = activeSkills[Math.floor(Math.random() * activeSkills.length)];
		io.to(room.id).emit("boss_skill_warning", { skill, countdown: 2 });

		setTimeout(() => {
			if (room.state === "playing" && room.boss && room.boss.hp > 0) {
				executeBossSkill(room, skill);
			}
		}, 2000);
	}, intervalMs);
}

function executeBossSkill(room, skill) {
	const boss = room.boss;
	if (!boss || boss.hp <= 0 || room.state !== "playing") return;

	if (skill === "shield") {
		const activeCount = Math.max(
			1,
			room.players.filter((p) => !p.isSurrendered && !p.isDisconnected).length,
		);
		const shieldVal = activeCount * (boss.shieldBasePerPlayer || 40);
		boss.shield = shieldVal;
		boss.maxShield = shieldVal;
		boss.isShieldActive = true;

		io.to(room.id).emit("boss_shield_start", {
			shield: boss.shield,
			maxShield: boss.maxShield,
			duration: boss.shieldDuration || 6,
		});

		clearTimeout(boss.shieldTimer);
		boss.shieldTimer = setTimeout(
			() => {
				if (room.state === "playing" && boss && boss.isShieldActive && boss.shield > 0) {
					const healAmount = boss.shield;
					boss.hp = Math.min(boss.maxHp, boss.hp + healAmount);
					boss.isShieldActive = false;
					boss.shield = 0;

					io.to(room.id).emit("boss_shield_failed", {
						healAmount,
						hp: boss.hp,
						maxHp: boss.maxHp,
						message: `⚠️ KHÔNG PHÁ ĐƯỢC GIÁP! Boss hấp thụ ${healAmount} HP & Sóng xung kích làm hỏng Combo!`,
					});
					io.to(room.id).emit("boss_hp_update", {
						hp: boss.hp,
						maxHp: boss.maxHp,
						shield: 0,
						maxShield: boss.maxShield,
					});
				}
			},
			(boss.shieldDuration || 6) * 1000,
		);
	} else if (skill === "capslock") {
		const dur = boss.capslockDuration || 6;
		boss.isCapsLockActive = true;
		io.to(room.id).emit("boss_capslock_start", { duration: dur });

		clearTimeout(boss.capsLockTimer);
		boss.capsLockTimer = setTimeout(() => {
			if (boss) boss.isCapsLockActive = false;
			io.to(room.id).emit("boss_capslock_end");
		}, dur * 1000);
	} else if (skill === "shake") {
		io.to(room.id).emit("boss_skill_cast", { skill, duration: boss.shakeDuration || 5 });
	} else if (skill === "fog") {
		io.to(room.id).emit("boss_skill_cast", { skill, duration: boss.fogDuration || 5 });
	} else if (skill === "reverse") {
		io.to(room.id).emit("boss_skill_cast", { skill, duration: boss.reverseDuration || 5 });
	}
}

function finishMatch(room) {
	if (room.state === "finished") return;
	room.state = "finished";
	clearRoomTimers(room);

	const isBoss = room.lang === "san_boss";
	const isVictory = isBoss ? room.boss && room.boss.hp <= 0 : true;

	const leaderboard = [...room.players].sort((a, b) => {
		const inactA = a.isSurrendered || a.isDisconnected || a.isAFK;
		const inactB = b.isSurrendered || b.isDisconnected || b.isAFK;
		if (inactA !== inactB) return inactA ? 1 : -1;
		if (inactA && inactB)
			return (b.correctChars || 0) - (a.correctChars || 0) || (a.errors || 0) - (b.errors || 0);

		const scoreA = room.lang === "ngau_hung" || isBoss ? a.score || 0 : a.wpm || 0;
		const scoreB = room.lang === "ngau_hung" || isBoss ? b.score || 0 : b.wpm || 0;
		return (
			scoreB - scoreA ||
			(b.correctChars || 0) - (a.correctChars || 0) ||
			(a.errors || 0) - (b.errors || 0)
		);
	});

	io.to(room.id).emit("game_over", {
		leaderboard,
		language: room.lang,
		difficulty: room.difficulty,
		isBossVictory: isVictory,
		boss: room.boss,
	});

	leaderboard.forEach((p) => {
		if (!p.isSurrendered && !p.isDisconnected && !p.isAFK) {
			updateHighScoresAndBroadcast(
				room.lang,
				p.username,
				p.wpm || 0,
				p.errors || 0,
				room.players.length,
				p.score || 0,
			);
		}
	});

	if (rooms[room.lang]) rooms[room.lang] = rooms[room.lang].filter((r) => r.id !== room.id);
}

// ==========================================
// 6. SOCKET.IO EVENTS
// ==========================================
io.on("connection", (socket) => {
	totalOnlineUsers++;
	connectedUsers.set(socket.id, { id: socket.id, username: "Vô danh", isAdmin: false });

	io.emit("update_online_count", totalOnlineUsers);
	socket.emit("init_high_scores", highScores);
	socket.emit("load_initial_messages", chatMessages);
	socket.emit("sync_game_config", GAME_CONFIG);
	broadcastAdminData();

	let currentRoom = null,
		player = null;

	function leaveCurrentLobby() {
		if (!currentRoom || !player) return;
		socket.leave(currentRoom.id);

		if (currentRoom.state === "playing") {
			player.isDisconnected = true;
			if (currentRoom.lang === "san_boss") {
				handlePlayerSelfDestruct(currentRoom, player, "rời phòng");
			}

			io.to(currentRoom.id).emit("race_update", currentRoom.players);
			const active = currentRoom.players.filter(
				(p) => !p.isSurrendered && !p.isDisconnected && !p.isAFK,
			);
			if (
				(currentRoom.lang === "ngau_hung" || currentRoom.lang === "san_boss") &&
				active.length === 0
			) {
				finishMatch(currentRoom);
			} else {
				checkMatchCompletion(currentRoom);
			}
		} else {
			currentRoom.players = currentRoom.players.filter((p) => p.id !== socket.id);
			if (currentRoom.players.length === 0) {
				clearRoomTimers(currentRoom);
				rooms[currentRoom.lang] = rooms[currentRoom.lang].filter((r) => r.id !== currentRoom.id);
			} else {
				io.to(currentRoom.id).emit("update_lobby", {
					players: currentRoom.players,
					language: currentRoom.lang,
					difficulty: currentRoom.difficulty || "normal",
				});
			}
		}
		currentRoom = player = null;
	}

	socket.on("admin_login", ({ password }) => {
		const success = password === ADMIN_PASSWORD;
		socket.isAdmin = success;
		const u = connectedUsers.get(socket.id);
		if (u) u.isAdmin = success;
		socket.emit("admin_login_response", {
			success,
			message: success ? "" : "Mật khẩu Admin không chính xác!",
		});
		if (success) broadcastAdminData();
	});

	socket.on("admin_logout", () => {
		socket.isAdmin = false;
		const u = connectedUsers.get(socket.id);
		if (u) u.isAdmin = false;
		socket.emit("admin_logout_response");
		broadcastAdminData();
	});

	socket.on("admin_update_config", (newConfig) => {
		if (!socket.isAdmin) return;
		try {
			if (newConfig.normalRace) Object.assign(GAME_CONFIG.normalRace, newConfig.normalRace);
			if (newConfig.numpad) Object.assign(GAME_CONFIG.numpad, newConfig.numpad);
			if (newConfig.ngauHung && newConfig.ngauHung.difficulties) {
				Object.keys(newConfig.ngauHung.difficulties).forEach((k) => {
					if (GAME_CONFIG.ngauHung.difficulties[k]) {
						Object.assign(GAME_CONFIG.ngauHung.difficulties[k], newConfig.ngauHung.difficulties[k]);
					}
				});
			}
			if (newConfig.sanBoss && newConfig.sanBoss.difficulties) {
				Object.keys(newConfig.sanBoss.difficulties).forEach((k) => {
					if (GAME_CONFIG.sanBoss.difficulties[k]) {
						Object.assign(GAME_CONFIG.sanBoss.difficulties[k], newConfig.sanBoss.difficulties[k]);
					}
				});
			}
			io.emit("sync_game_config", GAME_CONFIG);
			broadcastAdminData();
			socket.emit("admin_config_saved", {
				success: true,
				message: "Cập nhật cài đặt thành công!",
			});
		} catch (e) {
			socket.emit("admin_config_saved", { success: false, message: "Lỗi cập nhật cấu hình!" });
		}
	});

	socket.on("admin_ban_user", ({ targetSocketId }) => {
		if (!socket.isAdmin) return;
		const expiresAt = Date.now() + 5 * 60 * 1000;
		const targetUser = connectedUsers.get(targetSocketId);
		bannedUsers.set(targetSocketId, {
			id: targetSocketId,
			username: targetUser ? targetUser.username : "Vô danh",
			bannedAt: Date.now(),
			expiresAt,
			timeoutId: setTimeout(() => unbanUser(targetSocketId), 5 * 60 * 1000),
		});
		io.to(targetSocketId).emit("banned_notice", {
			message: "Bạn đã bị Admin tạm cấm 5 phút!",
			expiresAt,
		});
		broadcastAdminData();
	});

	socket.on("admin_unban_user", ({ targetId }) => {
		if (socket.isAdmin) unbanUser(targetId);
	});

	socket.on("admin_clear_chat", () => {
		if (!socket.isAdmin) return;
		chatMessages = [];
		fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2), "utf8");
		io.emit("clear_global_chat");
	});

	socket.on("admin_reset_highscore", ({ lang }) => {
		if (socket.isAdmin && highScores[lang] !== undefined) {
			highScores[lang] = null;
			saveHighScores();
			io.emit("update_high_scores", highScores);
		}
	});

	socket.on("admin_kick_lobby_player", ({ targetSocketId }) => {
		if (socket.isAdmin)
			io.to(targetSocketId).emit("kicked_from_lobby", {
				message: "Bạn đã bị Quản trị viên đá khỏi phòng chờ!",
			});
	});

	socket.on("update_username", (data) => {
		const newName = (data.username || "").trim() || "Vô danh";
		const u = connectedUsers.get(socket.id);
		if (u) {
			u.username = newName;
			broadcastAdminData();
		}
		if (player) player.username = newName;

		if (currentRoom) {
			if (currentRoom.state === "waiting") {
				io.to(currentRoom.id).emit("update_lobby", {
					players: currentRoom.players,
					language: currentRoom.lang,
					difficulty: currentRoom.difficulty || "normal",
				});
			} else if (currentRoom.state === "playing") {
				io.to(currentRoom.id).emit("race_update", currentRoom.players);
			}
		}
	});

	socket.on("send_global_chat", (data) => {
		const spam = checkSpamLimit(socket.id);
		if (!spam.allowed)
			return socket.emit("chat_error", {
				message: `Thao tác quá nhanh! Chờ ${spam.remainingSec}s.`,
			});

		const msgData = {
			username: data.username || "Vô danh",
			message: data.message,
			timestamp: Date.now(),
		};
		chatMessages.push(msgData);
		cleanOldMessages();
		fs.writeFileSync(MESSAGES_FILE, JSON.stringify(chatMessages, null, 2), "utf8");
		io.emit("receive_global_chat", msgData);
	});

	socket.on("send_in_game_chat", (data) => {
		if (currentRoom) {
			const u = connectedUsers.get(socket.id);
			io.to(currentRoom.id).emit("receive_in_game_chat", {
				username: u ? u.username : "Vô danh",
				message: data.message,
			});
		}
	});

	socket.on("join_lobby", (data) => {
		if (isUserBanned(socket.id)) {
			return socket.emit("join_lobby_banned", {
				message: "Bạn đang bị cấm tham gia phòng!",
				expiresAt: bannedUsers.get(socket.id)?.expiresAt,
			});
		}
		leaveCurrentLobby();
		const lang = data.language || "vi_dau";
		currentRoom = getOrCreateRoom(lang);
		player = {
			id: socket.id,
			username: data.username || "Vô danh",
			icon: data.selectedIcon || "🤖",
			progress: 0,
			wpm: 0,
			score: 0,
			errors: 0,
			correctChars: 0,
			isFinished: false,
			isSurrendered: false,
			isAFK: false,
			isDisconnected: false,
			hasSelfDestructed: false,
		};
		currentRoom.players.push(player);
		socket.join(currentRoom.id);
		io.to(currentRoom.id).emit("update_lobby", {
			players: currentRoom.players,
			language: currentRoom.lang,
			difficulty: currentRoom.difficulty || "normal",
		});
	});

	socket.on("select_icon", (data) => {
		if (currentRoom && player) {
			player.icon = data.icon;
			io.to(currentRoom.id).emit("update_lobby", {
				players: currentRoom.players,
				language: currentRoom.lang,
				difficulty: currentRoom.difficulty || "normal",
			});
		}
	});

	// CHỌN ĐỘ KHÓ: TÁCH BIỆT XỬ LÝ CHO NGẪU HỨNG & SĂN BOSS
	socket.on("select_difficulty", (data) => {
		if (!currentRoom || currentRoom.state !== "waiting") return;
		const diff = data.difficulty || "normal";

		if (currentRoom.lang === "ngau_hung") {
			if (GAME_CONFIG.ngauHung.difficulties[diff]) {
				currentRoom.difficulty = diff;
				const nhDiff = GAME_CONFIG.ngauHung.difficulties[diff];
				currentRoom.totalRounds = nhDiff.totalRounds || 15;
				currentRoom.words = generateWords("ngau_hung", currentRoom.totalRounds, diff);

				io.to(currentRoom.id).emit("update_lobby", {
					players: currentRoom.players,
					language: currentRoom.lang,
					difficulty: currentRoom.difficulty,
				});
			}
		} else if (currentRoom.lang === "san_boss") {
			if (GAME_CONFIG.sanBoss.difficulties[diff]) {
				currentRoom.difficulty = diff;
				io.to(currentRoom.id).emit("update_lobby", {
					players: currentRoom.players,
					language: currentRoom.lang,
					difficulty: currentRoom.difficulty,
				});
			}
		}
	});

	socket.on("force_start_game", () => {
		if (currentRoom && currentRoom.state === "waiting") {
			currentRoom.state = "playing";
			currentRoom.startTime = Date.now();

			if (currentRoom.lang === "san_boss") {
				const pCount = Math.max(1, currentRoom.players.length);
				const diffConfig =
					GAME_CONFIG.sanBoss.difficulties[currentRoom.difficulty] ||
					GAME_CONFIG.sanBoss.difficulties.normal;

				const maxHp = diffConfig.baseHp + (pCount - 1) * diffConfig.hpPerPlayer;

				currentRoom.boss = {
					name: "HẮC LONG MA VƯƠNG",
					icon: "🐉",
					hp: maxHp,
					maxHp: maxHp,
					difficulty: currentRoom.difficulty,
					shield: 0,
					maxShield: 0,
					isShieldActive: false,
					isStunned: false,
					isCapsLockActive: false,
					duration: diffConfig.duration,
					shieldBasePerPlayer: diffConfig.shieldBasePerPlayer,
					shieldDuration: diffConfig.shieldDuration,
					stunDuration: diffConfig.stunDuration,
					shakeDuration: diffConfig.shakeDuration,
					fogDuration: diffConfig.fogDuration,
					reverseDuration: diffConfig.reverseDuration,
					capslockDuration: diffConfig.capslockDuration,
					skillInterval: diffConfig.skillInterval,
					enabledSkills: diffConfig.enabledSkills || {
						shield: true,
						capslock: true,
						shake: true,
						fog: true,
						reverse: false,
					},
					selfDestructTarget: diffConfig.selfDestructTarget,
				};

				clearTimeout(currentRoom.matchTimeout);
				currentRoom.matchTimeout = setTimeout(
					() => {
						if (currentRoom && currentRoom.state === "playing") finishMatch(currentRoom);
					},
					(diffConfig.duration + 3) * 1000,
				);
			} else if (currentRoom.lang === "ngau_hung") {
				const nhDiff =
					GAME_CONFIG.ngauHung.difficulties[currentRoom.difficulty] ||
					GAME_CONFIG.ngauHung.difficulties.normal;
				currentRoom.totalRounds = nhDiff.totalRounds || 15;
				currentRoom.words = generateWords(
					"ngau_hung",
					currentRoom.totalRounds,
					currentRoom.difficulty,
				);
			}

			io.to(currentRoom.id).emit("game_start", {
				words: currentRoom.words,
				players: currentRoom.players,
				countdown: 3,
				language: currentRoom.lang,
				difficulty: currentRoom.difficulty || "normal",
				boss: currentRoom.boss,
			});

			if (currentRoom.lang === "ngau_hung") {
				currentRoom.currentRound = 0;
				setTimeout(() => {
					if (currentRoom?.state === "playing") startNgauHungRound(currentRoom);
				}, 3000);
			} else if (currentRoom.lang === "san_boss") {
				setTimeout(() => {
					if (currentRoom?.state === "playing") startBossSkillLoop(currentRoom);
				}, 3000);
			}
		}
	});

	socket.on("deal_boss_damage", (data) => {
		if (
			!currentRoom ||
			currentRoom.lang !== "san_boss" ||
			currentRoom.state !== "playing" ||
			!player ||
			!currentRoom.boss
		)
			return;
		if (player.isSurrendered || player.isDisconnected || player.isAFK) return;

		let dmg = Math.max(0, data.damage || 0);

		if (currentRoom.boss.isStunned && dmg > 0) {
			dmg = Math.round(dmg * 1.5);
		}

		player.score = (player.score || 0) + dmg;
		player.correctChars = (player.correctChars || 0) + dmg;
		if (typeof data.errors === "number") player.errors = data.errors;

		if (dmg > 0) {
			if (currentRoom.boss.isShieldActive && currentRoom.boss.shield > 0) {
				if (currentRoom.boss.shield >= dmg) {
					currentRoom.boss.shield -= dmg;
					dmg = 0;
				} else {
					dmg -= currentRoom.boss.shield;
					currentRoom.boss.shield = 0;
				}

				if (currentRoom.boss.shield <= 0) {
					currentRoom.boss.isShieldActive = false;
					currentRoom.boss.shield = 0;
					currentRoom.boss.isStunned = true;
					clearTimeout(currentRoom.boss.shieldTimer);

					io.to(currentRoom.id).emit("boss_shield_broken", {
						stunDuration: currentRoom.boss.stunDuration,
						message: `⚡ GIÁP ĐÃ VỠ! Boss bị Choáng ${currentRoom.boss.stunDuration}s (Nhận x1.5 Sát thương)!`,
					});

					clearTimeout(currentRoom.boss.stunTimer);
					currentRoom.boss.stunTimer = setTimeout(() => {
						if (currentRoom?.boss) {
							currentRoom.boss.isStunned = false;
							io.to(currentRoom.id).emit("boss_stun_end");
						}
					}, currentRoom.boss.stunDuration * 1000);
				}
			}

			if (dmg > 0) {
				currentRoom.boss.hp = Math.max(0, currentRoom.boss.hp - dmg);
			}
		}

		player.progress = Math.min(
			100,
			Math.round(((currentRoom.boss.maxHp - currentRoom.boss.hp) / currentRoom.boss.maxHp) * 100),
		);

		io.to(currentRoom.id).emit("boss_hp_update", {
			hp: currentRoom.boss.hp,
			maxHp: currentRoom.boss.maxHp,
			shield: currentRoom.boss.shield || 0,
			maxShield: currentRoom.boss.maxShield || 0,
			isShieldActive: currentRoom.boss.isShieldActive,
			isStunned: currentRoom.boss.isStunned,
			damager: player.username,
			damage: data.damage || 0,
			players: currentRoom.players,
		});

		if (currentRoom.boss.hp <= 0) {
			currentRoom.boss.hp = 0;
			finishMatch(currentRoom);
		}
	});

	socket.on("submit_ngau_hung_word", (data) => {
		if (
			!currentRoom ||
			currentRoom.lang !== "ngau_hung" ||
			!currentRoom.roundActive ||
			!player ||
			player.isSurrendered
		)
			return;
		if (typeof data.errors === "number") player.errors = data.errors;

		const target = currentRoom.words[currentRoom.currentRound - 1];
		if (data.word === target && !currentRoom.roundWinners.includes(socket.id)) {
			currentRoom.roundWinners.push(socket.id);
			const rank = currentRoom.roundWinners.length;
			const pts = rank === 1 ? 3 : rank === 2 ? 2 : rank === 3 ? 1 : 0;
			player.score = (player.score || 0) + pts;
			player.correctChars = (player.correctChars || 0) + target.length;
			player.progress = Math.round((currentRoom.currentRound / currentRoom.totalRounds) * 100);

			socket.emit("ngau_hung_player_success", {
				rank,
				pointsAwarded: pts,
				totalScore: player.score,
			});
			io.to(currentRoom.id).emit("race_update", currentRoom.players);

			const activeCount = currentRoom.players.filter(
				(p) => !p.isSurrendered && !p.isDisconnected && !p.isAFK,
			).length;
			if (currentRoom.roundWinners.length >= Math.min(3, activeCount))
				endNgauHungRound(currentRoom);
		}
	});

	socket.on("leave_lobby", leaveCurrentLobby);

	socket.on("update_progress", (data) => {
		if (currentRoom && player) {
			if (typeof data.progress === "number") player.progress = data.progress;
			if (typeof data.wpm === "number") player.wpm = data.wpm;
			if (typeof data.correctChars === "number") player.correctChars = data.correctChars;
			if (typeof data.errors === "number") player.errors = data.errors;

			io.to(currentRoom.id).emit("race_update", currentRoom.players);
		}
	});

	socket.on("player_finished", (data) => {
		if (currentRoom && player) {
			Object.assign(player, {
				progress: 100,
				wpm: data.wpm,
				correctChars: data.correctChars,
				errors: data.errors,
				isFinished: true,
			});
			io.to(currentRoom.id).emit("race_update", currentRoom.players);
			checkMatchCompletion(currentRoom);
		}
	});

	socket.on("surrender", (data) => {
		if (currentRoom && player) {
			player.isSurrendered = true;
			if (data?.isAFK) player.isAFK = true;

			if (currentRoom.lang === "san_boss") {
				handlePlayerSelfDestruct(currentRoom, player, data?.isAFK ? "AFK" : "đầu hàng");
			}

			io.to(currentRoom.id).emit("race_update", currentRoom.players);
			const active = currentRoom.players.filter(
				(p) => !p.isSurrendered && !p.isDisconnected && !p.isAFK,
			);
			if (
				(currentRoom.lang === "ngau_hung" || currentRoom.lang === "san_boss") &&
				active.length === 0
			) {
				finishMatch(currentRoom);
			} else {
				checkMatchCompletion(currentRoom);
			}
		}
	});

	socket.on("disconnect", () => {
		totalOnlineUsers = Math.max(0, totalOnlineUsers - 1);
		connectedUsers.delete(socket.id);
		leaveCurrentLobby();
		io.emit("update_online_count", totalOnlineUsers);
		broadcastAdminData();
	});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server đang chạy tại http://localhost:${PORT}`));
