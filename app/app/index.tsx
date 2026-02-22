import {
	Alert,
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
import {Pencil, Plus, Trash} from "lucide-react-native/icons";
import {Colors} from "@/constants/theme";
import {SafeAreaView} from "react-native-safe-area-context";
import {useEffect, useState} from "react";
import {DateTimePickerAndroid} from "@react-native-community/datetimepicker";
import {Swipeable} from "react-native-gesture-handler";
import {Checkbox} from "expo-checkbox";
import {useSQLiteContext} from "expo-sqlite";
import {useFocusEffect} from "expo-router";
import {loadAndSetYuanValue} from "@/constants/helpers/db";

type PaymentData = {
	id: number;
	title: number;
	value: number;
	by_user: boolean;
	made_on: Date;
}

function addZeroBefore(value: number) {
	return (value < 10) ? "0" + value : value;
}

function getCleanHours(targetDate: Date) {
	return `${addZeroBefore(targetDate.getHours())}:${addZeroBefore(targetDate.getMinutes())}`;
}

function PaymentItem({payment, openDeleteModal}: {
	payment: PaymentData,
	openDeleteModal: (target: PaymentData) => void
}) {
	function deletePayment() {
		Alert.alert("Delete payment", `Are you sure you want to delete the payment:\n\n'${payment.title}' - ${payment.value}¥`, [{
			text: "Cancel",
			style: "cancel"
		}, {
			text: "Delete", onPress: () => {

			}, style: "destructive"
		}], {cancelable: true});
	}

	const LeftAction = () => (
		<Pressable style={({pressed}) => [
			{
				backgroundColor: pressed ? "#2b4ae3" : "#8c90fb",
				paddingHorizontal: 15
			}
		]} onPress={() => console.log("here")}>
			<Pencil style={{margin: "auto"}}/>
		</Pressable>
	)

	const RightAction = () => (
		<Pressable style={({pressed}) => [
			{
				backgroundColor: pressed ? "#e32b2b" : "#fb8c8c",
				paddingHorizontal: 15
			}
		]} onPress={() => openDeleteModal(payment)}>
			<Trash style={{margin: "auto"}}/>
		</Pressable>
	)

	return (
		<Swipeable overshootRight={false} overshootLeft={false}
				   renderLeftActions={LeftAction}
				   renderRightActions={RightAction}
				   friction={2}
				   containerStyle={{
					   borderRadius: 5,
					   backgroundColor: "#0c2806",
					   overflow: "hidden"
				   }}
				   childrenContainerStyle={{
					   backgroundColor: payment.by_user ? "#0c2806" : "#280606",
					   padding: 15,
					   width: "100%",
					   flexDirection: "row",
					   alignItems: "center",
					   justifyContent: "space-between",
					   gap: 10,
					   borderRadius: 5,
				   }}
		>
			<View style={{flex: 1}}>
				<Text style={{fontSize: 16, fontWeight: "bold", lineHeight: 16, color: Colors.text}}>
					{payment.title}
				</Text>
				<Text style={{fontSize: 12, color: Colors.text}}>
					{payment.made_on.toLocaleDateString()} {getCleanHours(payment.made_on)}
				</Text>
			</View>
			<View style={{flexDirection: "row", alignItems: "flex-end", gap: 2.5}}>
				<Text style={{fontSize: 18, fontWeight: "bold", color: Colors.text}}>
					{payment.value}
				</Text>
				<Text style={{fontSize: 12, color: Colors.text}}>¥</Text>
			</View>
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
	const [paymentByUser, setPaymentByUser] = useState(false);
	const [editPaymentID, setEditPaymentID] = useState<number | null>(null);
	const [totalSpent, setTotalSpent] = useState(0);
	const [yuanValue, setYuanValue] = useState<string>();
	const [deleteModalVisible, setDeleteModalVisible] = useState(false);
	const [selectedPayment, setSelectedPayment] = useState<PaymentData>();

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

	function handleModalOpen(recordID: number | null) {
		if (recordID === null) {
			setPaymentTitle("");
			setPaymentByUser(false);
			setPaymentValue("");
			setPaymentDate(new Date());
		} else {
			// TODO: edit record
		}

		setEditPaymentID(recordID);
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

		if (editPaymentID === null) {
			await db.runAsync("INSERT INTO payment (title, total, paid_by_user, made_on) VALUES (?, ?, ?, ?)",
				paymentTitle, paymentValueNumber, paymentByUser, paymentDate.getTime());
			ToastAndroid.show("Payment created", ToastAndroid.SHORT);
			setModalVisible(false);
			fetchPayments();
		} else {
			// TODO: edit record
		}
	}

	function fetchPayments() {
		if (!yuanValue) {
			return;
		}

		let result = db.getAllSync<PaymentData>("SELECT id, title, total AS value, paid_by_user AS by_user, made_on FROM payment ORDER BY made_on DESC");

		let totalSpent = 0;
		result = result.map((r) => {
			r.made_on = new Date(r.made_on);
			totalSpent += r.value;
			return r
		});

		setTotalSpent(totalSpent);
		setPayments(result);
	}

	useFocusEffect(() => {
		loadAndSetYuanValue(db, setYuanValue);
	});
	useEffect(fetchPayments, [db, yuanValue]);

	function openDeleteModal(target: PaymentData) {
		setSelectedPayment(target);
		setDeleteModalVisible(true);
	}

	return (
		<SafeAreaView style={{marginHorizontal: 20, flex: 1}}>
			<Modal animationType={"fade"} visible={deleteModalVisible} transparent={true}
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
			<Modal animationType="slide" visible={modalVisible} transparent
				   onRequestClose={() => setModalVisible(false)}>
				<Pressable style={{flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)"}}
						   onPress={() => setModalVisible(false)}/>
				<View>
					<ScrollView keyboardShouldPersistTaps="handled"
								style={{backgroundColor: Colors.brightBackground, padding: 25}}>
						<Text style={{color: Colors.text, fontSize: 26, fontWeight: "bold"}}>
							New payment
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
											{addZeroBefore(paymentDate.getHours())}:{addZeroBefore(paymentDate.getMinutes())}
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
						<View style={{marginTop: 20, flexDirection: "row", gap: 10, alignItems: "center"}}>
							<Checkbox value={paymentByUser} onValueChange={setPaymentByUser}
									  color={Colors.softerSecondary} style={{height: 20, width: 20}}/>
							<Pressable onPress={() => setPaymentByUser(!paymentByUser)}>
								<Text style={{color: Colors.text, fontSize: 16}}>Paid by me</Text>
							</Pressable>
						</View>
						<Pressable style={({pressed}) => [{
							marginTop: 50,
							backgroundColor: pressed ? Colors.accent : Colors.primary,
							borderRadius: 5,
							padding: 10,
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "center",
							gap: 5
						}]} onPress={handleModalSubmit}>
							<Plus strokeWidth={4} size={18} color={Colors.background}/>
							<Text style={{
								color: Colors.background,
								fontWeight: "bold",
								textAlign: "center",
								fontSize: 16
							}}>
								Create new
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
				paddingVertical: 25
			}}>
				<View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
					<Text style={{color: Colors.text, fontWeight: "bold", fontSize: 20}}>{totalSpent} ¥</Text>
					<Text style={{color: Colors.primary, fontSize: 12, fontWeight: "bold"}}>YUAN</Text>
				</View>
				<View style={{
					borderColor: Colors.softerSecondary,
					width: 0,
					height: 50,
					borderWidth: 2,
					borderRadius: 99,
					marginHorizontal: 2.5
				}}/>
				<View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
					<Text style={{color: Colors.text, fontWeight: "bold", fontSize: 20}}>
						{yuanValue ? (totalSpent / Number(yuanValue)).toFixed(2) : "--"} €
					</Text>
					<Text style={{color: Colors.primary, fontSize: 12}}>EUR</Text>
				</View>
			</View>
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
					onPress={() => handleModalOpen(null)}
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
					  renderItem={(data) => <PaymentItem payment={data.item} openDeleteModal={openDeleteModal}/>}
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