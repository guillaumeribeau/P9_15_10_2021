import { screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES } from "../constants/routes";
import { fireEvent } from "@testing-library/dom";
import firebase from "../__mocks__/firebase";
import BillsUI from "../views/BillsUI.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page and I add a file", () => {
    test("Then a new file should be change in the input file", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        localStorage: window.localStorage,
      });
      const file = screen.getByTestId("file");
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file, {
        target: {
          files: [new File(["image.jpg"], "image.jpg", { type: "image/jpeg" })],
        },
      });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(file.files[0].name).toBe("image.jpg");
    });
  });

  describe("When I am on NewBill Page and I submit the form width an image with the correct format (jpg, jpeg, png)", () => {
    test("Then a new bill should be create", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      screen.getByTestId("expense-type").value = "Restaurants et bars";
      screen.getByTestId("expense-name").value = "Afterwork";
      screen.getByTestId("datepicker").value = "2021-05-24";
      screen.getByTestId("amount").value = 100;
      screen.getByTestId("vat").value = "70";
      screen.getByTestId("pct").value = 20;
      screen.getByTestId("commentary").value = "Cohésion d'équipe";

      const newBill = new NewBill({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });
      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
      expect(handleSubmit.mock.results).toEqual([
        {
          type: "return",
          value: {
            email: undefined,
            type: "Restaurants et bars",
            name: "Afterwork",
            amount: 100,
            date: "2021-05-24",
            vat: "70",
            pct: 20,
            commentary: "Cohésion d'équipe",
            fileUrl: null,
            fileName: null,
            status: "pending",
          },
        },
      ]);
    });
    test("Then it should render Bills page", () => {
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
  });

  describe("When I am on NewBill Page and I submit the form width an image with the incorrect format (pdf)", () => {
    test("Then a new bill shouldn't be create and I stay on the NewBill page", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        localStorage: window.localStorage,
      });
      newBill.fileName = "invalid";
      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
      expect(handleSubmit).toBeFalsy;
    });
    test("Then it should render NewBill page", () => {
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    });
  });
});

//test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I create a new bill", () => {
    test("Add bill to mock API POST", async () => {
      const getSpy = jest.spyOn(firebase, "post");
      const newBill = {
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl:
          "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "pending",
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        name: "encore",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2004-04-04",
        amount: 400,
        commentAdmin: "ok",
        email: "a@a",
        pct: 20,
      };
      const bills = await firebase.post(newBill);
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(5);
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.post.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.post.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
