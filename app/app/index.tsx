import {
	FlatList,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	ToastAndroid,
	TouchableWithoutFeedback,
	View
} from "react-native";
import {EllipsisVertical, Pencil, Plus, Trash} from "lucide-react-native/icons";
import {Colors} from "@/constants/theme";
import {SafeAreaView} from "react-native-safe-area-context";
import {useEffect, useRef, useState} from "react";
import {DateTimePickerAndroid} from "@react-native-community/datetimepicker";
import {Swipeable} from "react-native-gesture-handler";
import {useSQLiteContext} from "expo-sqlite";
import {useFocusEffect} from "expo-router";
import {DB_PAYMENT_TYPE, loadAndSetYuanValue} from "@/constants/helpers/db";
import {LinearGradient} from "expo-linear-gradient";

type PaymentData = {
	id: number;
	title: string;
	value: number;
	type: number;
	made_on: Date;
}

type PaymentTypeOption = {
	text: string;
	value: number;
	color: string;
}

const PAYMENTS_TYPE_MAP = new Map<number, PaymentTypeOption>();
PAYMENTS_TYPE_MAP.set(DB_PAYMENT_TYPE.USER, {
	text: "Mine",
	value: DB_PAYMENT_TYPE.USER,
	color: Colors.paymentTypeUser
});
PAYMENTS_TYPE_MAP.set(DB_PAYMENT_TYPE.DEBT_TO_FRIEND, {
	text: "Owe friend",
	value: DB_PAYMENT_TYPE.DEBT_TO_FRIEND,
	color: Colors.paymentTypeDebtToFriend
});
PAYMENTS_TYPE_MAP.set(DB_PAYMENT_TYPE.DEBT_TO_USER, {
	text: "Friend owes me",
	value: DB_PAYMENT_TYPE.DEBT_TO_USER,
	color: Colors.paymentTypeDebtToUser
});
PAYMENTS_TYPE_MAP.set(DB_PAYMENT_TYPE.FRIEND_SPLIT, {
	text: "I owe half to friend",
	value: DB_PAYMENT_TYPE.FRIEND_SPLIT,
	color: Colors.paymentTypeFriendSplit
});
PAYMENTS_TYPE_MAP.set(DB_PAYMENT_TYPE.USER_SPLIT, {
	text: "Friend owes me half",
	value: DB_PAYMENT_TYPE.USER_SPLIT,
	color: Colors.paymentTypeUserSplit
});
PAYMENTS_TYPE_MAP.set(DB_PAYMENT_TYPE.USER_PAYS_FRIEND, {
	text: "Paid friend",
	value: DB_PAYMENT_TYPE.USER_PAYS_FRIEND,
	color: Colors.paymentTypeUserFriend
});
PAYMENTS_TYPE_MAP.set(DB_PAYMENT_TYPE.FRIEND_PAYS_USER, {
	text: "Friend paid me",
	value: DB_PAYMENT_TYPE.FRIEND_PAYS_USER,
	color: Colors.paymentTypeFriendUser
});

function roundNumber(num: number, precision: number) {
	return Number(num.toFixed(precision));
}

function getCleanHours(targetDate: Date) {
	return targetDate.toLocaleTimeString("pt-PT", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

function PaymentItem({payment, openEditModal, openDeleteModal}: {
	payment: PaymentData,
	openEditModal: (recordToEdit: PaymentData) => void;
	openDeleteModal: (target: PaymentData) => void
}) {
	const swipeRef = useRef(null);

	const LeftAction = () => (
		<Pressable style={({pressed}) => [
			{
				backgroundColor: pressed ? "#2b4ae3" : "#8c90fb",
				paddingHorizontal: 15
			}
		]} onPress={() => {
			openEditModal(payment);
			if (swipeRef.current) {
				// @ts-ignore
				swipeRef.current.close();
			}
		}}>
			<Pencil style={{margin: "auto"}}/>
		</Pressable>
	)

	const RightAction = () => (
		<Pressable style={({pressed}) => [
			{
				backgroundColor: pressed ? "#e32b2b" : "#fb8c8c",
				paddingHorizontal: 15
			}
		]} onPress={() => {
			openDeleteModal(payment);
			if (swipeRef.current) {
				// @ts-ignore
				swipeRef.current.close();
			}
		}}>
			<Trash style={{margin: "auto"}}/>
		</Pressable>
	)

	const paymentCardBgColor: string = PAYMENTS_TYPE_MAP.get(payment.type)!.color;

	let total: number = 0;
	let realTotal = 0;
	// @ts-ignore
	if ([DB_PAYMENT_TYPE.USER_SPLIT, DB_PAYMENT_TYPE.FRIEND_SPLIT].includes(payment.type)) {
		total = roundNumber(payment.value / 2, 2);
		realTotal = payment.value;
	} else {
		total = payment.value;
	}

	return (
		<Swipeable overshootRight={false} overshootLeft={false} ref={swipeRef}
				   renderLeftActions={LeftAction}
				   renderRightActions={RightAction}
				   friction={2}
				   containerStyle={{
					   borderRadius: 5,
					   width: "100%",
				   }}
		>
			<LinearGradient
				colors={[paymentCardBgColor, Colors.softBackground]}
				style={{
					padding: 15, flex: 1, flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 10,
					height: 80
				}}
				dither={true}
				locations={[0, 0.85]}
				start={{x: 0, y: 0}}
				end={{x: 1, y: 0}}
			>
				<View style={{flex: 1}}>
					<Text style={{fontSize: 16, fontWeight: "bold", lineHeight: 16, color: Colors.text}}>
						{payment.title}
					</Text>
					<Text style={{fontSize: 12, color: Colors.text}}>
						{payment.made_on.toLocaleDateString()} {getCleanHours(payment.made_on)}
					</Text>
				</View>
				<View>
					{realTotal > 0 &&
                        <Text style={{
							color: Colors.text,
							fontSize: 10,
							opacity: 0.5,
							textAlign: "right"
						}}>
							{realTotal} ¥ / 2
                        </Text>
					}
					<View style={{flexDirection: "row", alignItems: "flex-end", gap: 2.5, justifyContent: "flex-end"}}>
						<Text style={{fontSize: 20, fontWeight: "bold", color: Colors.text}}>
							{total}
						</Text>
						<Text style={{fontSize: 12, color: Colors.text}}>¥</Text>
					</View>
					<Text style={{
						color: Colors.text,
						fontSize: 10,
						opacity: 0.5,
						textAlign: "right"
					}}>
						{roundNumber(total / 7.8, 2)} €
					</Text>
				</View>
			</LinearGradient>
		</Swipeable>
	);
}

export default function Index() {
	const db = useSQLiteContext();

	const [payments, setPayments] = useState<PaymentData[]>([]);
	const [modalVisible, setModalVisible] = useState(false);
	const [paymentDate, setPaymentDate] = useState(new Date());
	const [paymentValue, setPaymentValue] = useState("");
	const [paymentTitle, setPaymentTitle] = useState("");
	const [paymentType, setPaymentType] = useState<PaymentTypeOption>(PAYMENTS_TYPE_MAP.get(DB_PAYMENT_TYPE.USER)!);
	const [totalSpent, setTotalSpent] = useState(0);
	const [yuanValue, setYuanValue] = useState<string>();
	const [deleteModalVisible, setDeleteModalVisible] = useState(false);
	const [selectedPayment, setSelectedPayment] = useState<PaymentData>();
	const [totalDebt, setTotalDebt] = useState<number>(0);
	const [paymentTypeModalVisibility, setPaymentTypeModalVisibility] = useState(false);

	const showCalendarMode = (mode: "date" | "time") => {
		DateTimePickerAndroid.open({
			value: paymentDate,
			mode,
			is24Hour: true,
			onChange: (_, date) => {
				if (date) setPaymentDate(date)
			},
			style: {
				backgroundColor: "#00ffff",
			}
		});
	};

	function handleModalOpen(recordToEdit: PaymentData | undefined = undefined) {
		if (!recordToEdit) {
			setPaymentTitle("");
			setPaymentType(PAYMENTS_TYPE_MAP.get(DB_PAYMENT_TYPE.USER)!);
			setPaymentValue("");
			setPaymentDate(new Date());
		} else {
			setPaymentTitle(recordToEdit.title);
			setPaymentValue(String(recordToEdit.value));
			setPaymentType(PAYMENTS_TYPE_MAP.get(recordToEdit.type)!);
			setPaymentDate(recordToEdit.made_on);
		}

		setSelectedPayment(recordToEdit);
		setModalVisible(true);
	}

	async function handleModalSubmit() {
		if (!paymentTitle) {
			ToastAndroid.show("Payment title empty", ToastAndroid.SHORT);
			return;
		}

		const paymentValueNumber = Number(paymentValue);
		if (isNaN(paymentValueNumber) || paymentValueNumber <= 0) {
			ToastAndroid.show("Payment value not a number or zero", ToastAndroid.SHORT);
			return;
		}

		if (!selectedPayment) {
			await db.runAsync("INSERT INTO payment (title, total, type, made_on) VALUES (?, ?, ?, ?)",
				paymentTitle, paymentValueNumber, paymentType.value, paymentDate.getTime());
			ToastAndroid.show("Payment created", ToastAndroid.SHORT);
			setModalVisible(false);
			fetchPayments();
		} else {
			await db.runAsync("UPDATE payment SET title = ?, total = ?, type = ?, made_on = ? WHERE id = ?",
				paymentTitle, paymentValueNumber, paymentType.value, paymentDate.getTime(), selectedPayment?.id);
			ToastAndroid.show("Payment updated", ToastAndroid.SHORT);
			setModalVisible(false);
			fetchPayments();
		}
	}

	function fetchPayments() {
		if (!yuanValue) {
			return;
		}

		let result = db.getAllSync<PaymentData>("SELECT id, title, total AS value, type, made_on FROM payment ORDER BY made_on DESC");

		let totalSpent = 0;
		let totalDebt = 0;
		result = result.map((r) => {
			r.made_on = new Date(r.made_on);
			// @ts-ignore
			r.by_user = r.by_user === "true";

			// @ts-ignore
			if ([DB_PAYMENT_TYPE.USER, DB_PAYMENT_TYPE.USER_PAYS_FRIEND].includes(r.type)) {
				totalSpent += r.value;
			}

			switch (r.type) {
				case DB_PAYMENT_TYPE.USER:
					totalSpent += r.value;
					break;
				case DB_PAYMENT_TYPE.USER_SPLIT:
					totalDebt -= r.value / 2;
					break;
				case DB_PAYMENT_TYPE.FRIEND_SPLIT:
					totalDebt += r.value / 2;
					break;
				case DB_PAYMENT_TYPE.DEBT_TO_FRIEND:
					totalDebt += r.value;
					break;
				case DB_PAYMENT_TYPE.DEBT_TO_USER:
					totalDebt -= r.value;
					break;
				case DB_PAYMENT_TYPE.USER_PAYS_FRIEND:
					totalSpent += r.value;
					totalDebt -= r.value;
					break
				case DB_PAYMENT_TYPE.FRIEND_PAYS_USER:
					totalDebt -= r.value;
					break;
			}

			return r
		});

		setTotalSpent(totalSpent);
		setTotalDebt(totalDebt);
		setPayments(result);
	}

	useFocusEffect(() => {
		loadAndSetYuanValue(db, setYuanValue);
	});
	useEffect(fetchPayments, [db, yuanValue]);

	function openDeleteModal(target: PaymentData) {
		if (!target) {
			ToastAndroid.show("Can't open delete modal...", ToastAndroid.SHORT);
			return;
		}

		setSelectedPayment(target);
		setDeleteModalVisible(true);
	}

	return (
		<SafeAreaView style={{marginHorizontal: 20, flex: 1}}>
			<Modal animationType={"fade"} visible={deleteModalVisible} transparent
				   onRequestClose={() => setDeleteModalVisible(false)}>
				<Pressable style={{flex: 1, backgroundColor: "rgba(0,0,0,0.7)"}}
						   onPress={() => setDeleteModalVisible(false)}>
					<TouchableWithoutFeedback>
						<View style={{
							backgroundColor: Colors.brightBackground,
							marginVertical: "auto",
							marginHorizontal: 20,
							padding: 15,
							borderRadius: 5
						}}>
							<Text style={{fontSize: 24, fontWeight: "bold", color: Colors.text}}>
								Delete payment
							</Text>
							<View
								style={{
									borderBottomColor: Colors.softerSecondary,
									borderBottomWidth: 2,
									marginTop: 5,
									marginBottom: 20,
								}}
							/>
							<Text style={{color: Colors.text, fontSize: 16}}>
								Are you sure you want to delete the following payment record:
							</Text>
							<Text style={{color: Colors.text, marginTop: 10, fontSize: 16, fontWeight: "bold"}}>
								{selectedPayment?.title}
							</Text>
							<Text style={{color: Colors.text, fontSize: 16, fontWeight: "bold"}}>
								{selectedPayment?.value} ¥
							</Text>
							<View style={{flexDirection: "row", justifyContent: "flex-end", gap: 15, marginTop: 25}}>
								<Pressable style={{
									backgroundColor: Colors.text,
									paddingVertical: 10,
									paddingHorizontal: 20,
									borderRadius: 5
								}} onPress={() => setDeleteModalVisible(false)}>
									<Text style={{fontWeight: "bold"}}>Cancel</Text>
								</Pressable>
								<Pressable style={{
									backgroundColor: "#ce1c1c",
									paddingVertical: 10,
									paddingHorizontal: 20,
									borderRadius: 5
								}} onPress={() => {
									if (selectedPayment) {
										db.runSync("DELETE FROM payment WHERE ID = ?", selectedPayment.id);
										ToastAndroid.show("Payment deleted", ToastAndroid.SHORT);
										fetchPayments();
										setDeleteModalVisible(false);
										setSelectedPayment(undefined);
									}
								}}>
									<Text style={{fontWeight: "bold", color: Colors.text}}>Yes, I&#39;m sure!</Text>
								</Pressable>
							</View>
						</View>
					</TouchableWithoutFeedback>
				</Pressable>
			</Modal>
			<Modal visible={paymentTypeModalVisibility} transparent
				   onRequestClose={() => setPaymentTypeModalVisibility(false)}>
				<Pressable style={{backgroundColor: "rgba(0,0,0,0.75)", flex: 1}}
						   onPress={() => setPaymentTypeModalVisibility(false)}>
					<TouchableWithoutFeedback>
						<View
							style={{
								backgroundColor: Colors.brightBackground,
								marginVertical: "auto",
								marginHorizontal: 20,
								padding: 20,
								borderRadius: 5,
							}}>
							<Text style={{fontSize: 22, fontWeight: "bold", color: Colors.text, marginBottom: 20}}>
								Payment type
							</Text>
							<FlatList data={[...PAYMENTS_TYPE_MAP.values()]}
									  contentContainerStyle={{gap: 15, display: "flex"}}
									  renderItem={({item}) => <Pressable
										  style={({pressed}) => [{
											  backgroundColor: pressed ? Colors.accent : item.color,
											  borderRadius: 5,
											  padding: 10
										  }]}
										  onPress={() => {
											  setPaymentType(item);
											  setPaymentTypeModalVisibility(false);
										  }}>
										  <Text style={{color: Colors.text}}>{item.text}</Text>
									  </Pressable>}/>

						</View>
					</TouchableWithoutFeedback>
				</Pressable>
			</Modal>
			<Modal animationType="slide" visible={modalVisible} transparent
				   onRequestClose={() => setModalVisible(false)}>
				<Pressable style={{flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)"}}
						   onPress={() => setModalVisible(false)}/>
				<View>
					<ScrollView keyboardShouldPersistTaps="handled"
								style={{backgroundColor: Colors.brightBackground, padding: 25}}>
						<Text style={{color: Colors.text, fontSize: 26, fontWeight: "bold"}}>
							{!selectedPayment ? "New payment" : "Edit payment"}
						</Text>
						<TextInput placeholder="Title" value={paymentTitle} onChangeText={setPaymentTitle}
								   placeholderTextColor="rgba(248, 234, 239, 0.4)"
								   style={[styles.baseModalField, styles.modalFieldColors, {marginTop: 20}]}/>
						<View style={{
							display: "flex",
							flexDirection: "row",
							gap: 15,
							justifyContent: "space-between",
							marginTop: 20
						}}>
							<View>
								<View style={{display: "flex", flexDirection: "row", gap: 10}}>
									<Pressable style={styles.modalFieldColors} onPress={() => showCalendarMode("date")}>
										<Text style={styles.baseModalField}>{paymentDate.toLocaleDateString()}</Text>
									</Pressable>
									<Pressable style={styles.modalFieldColors} onPress={() => showCalendarMode("time")}>
										<Text style={styles.baseModalField}>
											{getCleanHours(paymentDate)}
										</Text>
									</Pressable>
								</View>
							</View>
							<View style={[styles.modalFieldColors, {
								flexDirection: "row",
								backgroundColor: Colors.softerSecondary,
								alignItems: "center",
								flex: 1
							}]}>
								<TextInput inputMode="decimal" placeholder="0"
										   placeholderTextColor="rgba(248, 234, 239, 0.4)"
										   style={[styles.baseModalField, {
											   flex: 1,
											   backgroundColor: Colors.background,
											   borderTopLeftRadius: 3,
											   borderBottomLeftRadius: 3,
											   textAlign: "right",
										   }]}
										   value={paymentValue}
										   onChangeText={(value) => setPaymentValue(value)}/>
								<Text style={[styles.baseModalField, {
									fontWeight: "bold"
								}]}>
									¥
								</Text>
							</View>
						</View>
						<View style={{marginTop: 20}}>
							<Pressable
								style={[styles.modalFieldColors, {
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "space-between",
									padding: 10,
									backgroundColor: paymentType.color
								}]}
								onPress={() => setPaymentTypeModalVisibility(true)}
							>
								<Text style={{color: Colors.text}}>{paymentType.text}</Text>
								<EllipsisVertical color={Colors.text} strokeWidth={2}/>
							</Pressable>
						</View>
						<Pressable style={({pressed}) => [{
							marginTop: 35,
							backgroundColor: pressed ? Colors.accent : Colors.primary,
							borderRadius: 5,
							padding: 10,
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "center",
							gap: 5
						}]} onPress={handleModalSubmit}>
							{!selectedPayment ? <Plus strokeWidth={4} size={18} color={Colors.background}/> :
								<Pencil strokeWidth={2} size={18} color={Colors.background}/>}

							<Text style={{
								color: Colors.background,
								fontWeight: "bold",
								textAlign: "center",
								fontSize: 16
							}}>
								{!selectedPayment ? "Create new" : "Edit"}
							</Text>
						</Pressable>
					</ScrollView>
				</View>
			</Modal>

			<View style={{
				display: "flex",
				flexDirection: "row",
				backgroundColor: Colors.brightBackground,
				borderRadius: 5,
				paddingVertical: 20,
				alignItems: "center"
			}}>
				<View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
					<Text
						style={{
							color: Colors.text,
							fontWeight: "bold",
							fontSize: 20
						}}>{roundNumber(totalSpent, 2)} ¥</Text>
				</View>
				<View style={{
					borderColor: Colors.softerSecondary,
					width: 0,
					height: "75%",
					borderWidth: 2,
					borderRadius: 99,
					marginHorizontal: 2.5
				}}/>
				<View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
					<Text style={{color: Colors.text, fontWeight: "bold", fontSize: 20}}>
						{yuanValue ? roundNumber(totalSpent / Number(yuanValue), 2) : "--"} €
					</Text>
				</View>
			</View>
			{yuanValue &&
                <View>
                    <Text style={{color: Colors.text, fontSize: 10, opacity: 0.5, textAlign: "right", marginTop: 2}}>
                        Conversion rate: 1€ = {yuanValue}¥
                    </Text>
                </View>
			}
			{totalDebt !== 0 &&
                <View style={{
					backgroundColor: "white",
					marginTop: 10,
					paddingHorizontal: 15,
					paddingVertical: 10,
					borderRadius: 5,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between"
				}}>
                    <Text style={{fontSize: 16, fontWeight: "bold"}}>
                        You {totalDebt > 0 ? "owe" : "are owed"}
                    </Text>
                    <View>
                        <Text style={{
							textAlign: "right",
							fontSize: 20,
							fontWeight: "bold"
						}}>{Math.abs(roundNumber(totalDebt, 2))} ¥</Text>
                        <Text style={{
							textAlign: "right",
							marginTop: -2.5,
							opacity: 0.25
						}}>
							{roundNumber(Math.abs(totalDebt) / Number(yuanValue), 2)} €
                        </Text>
                    </View>
                </View>
			}
			<View style={{
				marginTop: 15,
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "center"
			}}>
				<Text style={{color: Colors.text, fontSize: 26, fontWeight: "bold"}}>
					Payments
				</Text>
				<Pressable
					style={({pressed}) => [{
						backgroundColor: pressed ? Colors.accent : Colors.brighterPrimary,
						alignItems: "center",
						borderRadius: 5,
						flexDirection: "row",
						paddingHorizontal: 5,
						paddingVertical: 5,
						gap: 3
					}]}
					onPress={() => handleModalOpen()}
				>
					<Plus strokeWidth={4}/>
				</Pressable>
			</View>
			<FlatList style={{marginVertical: 10}} data={payments}
					  ListEmptyComponent={
						  <Text
							  style={{
								  color: Colors.text,
								  backgroundColor: Colors.softBackground,
								  textAlign: "center",
								  paddingVertical: 25,
								  borderRadius: 5,
							  }}
						  >
							  No payments registered yet
						  </Text>
					  }
					  renderItem={(data) => <PaymentItem payment={data.item} openEditModal={handleModalOpen}
														 openDeleteModal={openDeleteModal}/>}
					  contentContainerStyle={{
						  gap: 10
					  }}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	baseModalField: {
		color: Colors.text,
		padding: 10,
		fontSize: 16,
	},
	modalFieldColors: {
		backgroundColor: Colors.background,
		borderWidth: 2,
		borderColor: Colors.softerSecondary,
		borderRadius: 5
	}
});