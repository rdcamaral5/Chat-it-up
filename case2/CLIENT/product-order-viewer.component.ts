import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';
import { Vendor } from '@app/vendor/vendor';
import { Product } from '@app/product/product';
import { ProductOrderItem } from '@app/product-order/product-order-item';
import { ProductOrder } from '@app/product-order/product-order';
import { BASEURL, PDFURL } from '@app/constants';
import { VendorService } from '@app/vendor/vendor.service';
import { ProductService } from '@app/product/product.service';
import { ProductOrderService } from '@app/product-order/product-order.service';


@Component({
  selector: 'app-order-view-generator',
  templateUrl: './product-order-viewer.component.html',
})
export class ProductOrderViewerComponent implements OnInit, OnDestroy {
  // form
  generatorForm: FormGroup;
  vendorid: FormControl;
  productid: FormControl;
  productorderid: FormControl;
  qty: FormControl;
  // data
  pono: number = 0;
  subscription?: Subscription;
  finaltotal: number;
  finalitemcount: number;
  products$?: Observable<Product[]>; // everybody's products
  vendors$?: Observable<Vendor[]>; // all vendors
  productorders$?: Observable<ProductOrder[]>;
  vendorproducts$?: Observable<Product[]>; // all products for a particular vendor
  vendorproductorders$?: Observable<ProductOrder[]>;
  items: Array<ProductOrderItem>; // product items that will be in productorder
  selectedproducts: Product[]; // products that being displayed currently in app
  selectedProduct: Product; // the current selected product
  selectedPo: ProductOrder;
  productorderitemarray: ProductOrderItem[];
  selectedVendor: Vendor; // the current selected vendors
  selectedQty: number;
  // misc
  pickedProduct: boolean;
  pickedVendor: boolean;
  generated: boolean;
  hasProducts: boolean;
  msg: string;
  total: number;
  url: string;
  currentQty: number;
  selectedquantities: number[];
  constructor(
    private builder: FormBuilder,
    private vendorService: VendorService,
    private productService: ProductService,
    private productOrderService: ProductOrderService
  ) {
    this.finaltotal = 0.0;
    this.finalitemcount = 0;
    this.selectedQty = 1;
    this.pickedVendor = false;
    this.pickedProduct = false;
    this.generated = false;
    this.url = BASEURL + 'pos';
    this.msg = '';
    this.vendorid = new FormControl('');
    this.productid = new FormControl('');
    this.productorderid = new FormControl('');
    this.qty = new FormControl('');
    this.currentQty = 1;
    this.generatorForm = this.builder.group({
      productid: this.productid,
      vendorid: this.vendorid,
      qty: this.qty,
      productorderid: this.productorderid
    });
    this.selectedProduct = {
      id: '',
        vendorid: 0,
        name: '',
        costprice: 0.0,
        msrp: 0.0,
        rop: 0,
        eoq: 0,
        qoh: 0,
        qoo: 0,
        qrcode: '',
        qrcodetxt: ''
    };
    this.selectedPo = {
      id: 0,
      vendorid: 0,
      amount: 0,
      items: [],
      podate: ""

    };
    
    this.selectedVendor = {
      id: 0,
      name: '',
      address1: '',
      city: '',
      province: '',
     postalcode: '',
     type: '',
     phone: '',
     email: '',
    };
    this.items = new Array<ProductOrderItem>();
    this.selectedproducts = new Array<Product>();
    this.productorderitemarray = new Array<ProductOrderItem>();
    this.selectedquantities = new Array<number>();
    this.hasProducts = false;
    this.total = 0.0;
  } // constructor
  ngOnInit(): void {
    this.onPickVendor();
    this.onPickProductOrder();
    this.msg = 'loading vendors and products from server...';
    this.vendors$ = this.vendorService.getAll().pipe(
      catchError((error) => {
        if (error.error instanceof ErrorEvent) {
          this.msg = `Error: ${error.error.message}`;
        } else {
          this.msg = `Error: ${error.message}`;
        }
        return of([]); // returns an empty array if there's a problem
      })
    );
    

  this.products$ = this.productService.getAll().pipe(
    catchError((error) => {
      if (error.error instanceof ErrorEvent) {
        this.msg = `Error: ${error.error.message}`;
      } else {
        this.msg = `Error: ${error.message}`;
      }
      return of([]);
    })
  );
    this.msg = 'server data loaded';
  } // ngOnInit

  ngOnDestroy(): void {
    if (this.subscription !== undefined) {
      this.subscription.unsubscribe();
    }
  } // ngOnDestroy
  /**
   * onPickVendors - Another way to use Observables, subscribe to the select change event
   * then load specific vendors products for subsequent selection
   */
  onPickVendor(): void {
    this.subscription = this.generatorForm
      .get('vendorid')
      ?.valueChanges.subscribe((val) => {
        this.selectedPo = {
          id: 0,
          amount: 0,
        vendorid: 0,
        items: [],
        podate: ''
        };

        this.productorders$ = this.productOrderService.getAll().pipe(
          catchError((error) => {
            if (error.error instanceof ErrorEvent) {
              this.msg = `Error: ${error.error.message}`;
            } else {
              this.msg = `Error: ${error.message}`;
            }
            return of([]);
          })
        );


        this.selectedVendor = val;
        this.loadProductOrders();
        this.pickedProduct = false;
        this.hasProducts = false;
        this.msg = 'choose products for vendor';
        this.pickedVendor = true;
        this.generated = false;
        this.items = []; // array for the productorder
        this.selectedproducts = []; // array for the details in app html
      });
  } // onPickVendor
  /**
   * onPickProduct - subscribe to the select change event then
   * update array containing items.
   */
  onPickProductOrder(): void {
    const xSubscr = this.generatorForm
      .get('productid')
      ?.valueChanges.subscribe((val) => {
        this.selectedPo = val;
        const item: ProductOrderItem = {
          id: 0,
          poid: 0,
          qty: this.selectedQty,
          price: this.selectedProduct?.costprice,
          productid: this.selectedProduct?.id,
        };
        if (
          this.items.find((it) => it.productid === this.selectedProduct?.id)
        ) {
          // ignore entry
        } else {
          // add entry
          for (let i = 0; i < val.items.length; i++)
          {
            this.productorderitemarray.push(val.items[i])
            this.total += val.items[i].price * val.items[i].qty
          }
        }
       this.hasProducts = true;
      });
    this.subscription?.add(xSubscr); // add it as a child, so all can be destroyed together
      } 
      
      update(product: Product): void {
            this.msg = 'Updating...';
            this.productService.update(product).subscribe(
              (payload) => {
                if (payload.vendorid > 0) {
                } else {
                }
              },
              (err) => {
                this.msg = `Error - product not updated - ${err.status} - ${err.statusText}`;
              }
            );
      } // update


  // onPickProduct
  /**
   * loadVendorProducts - filter for a particular vendor's products
   */

  loadVendorProducts(): void {
    this.vendorproducts$ = this.products$?.pipe(
      map((products) =>
        // map each product in the array and check whether or not it belongs to selected vendor
        products.filter(
          (product) => product.vendorid === this.selectedVendor?.id
        )
      )
    );
  } // loadVendorProducts

  loadProductOrders(): void {
    this.vendorproductorders$ = this.productOrderService.getById(1).pipe(
      map((productorders) =>
        // map each product in the array and check whether or not it belongs to selected vendor
        productorders.filter(
          (productorder) => productorder.vendorid === this.selectedVendor?.id
        )
      )
    );
  } // loadVendorProducts
  /**
   * createProductOrder - create the client side productorder
   */
  createProductOrder(): void {
    this.generated = false;

    const productorder: ProductOrder = {
      id: 0,
      amount: this.total + this.total * 0.13,
      items: this.items,
      vendorid: this.selectedProduct.vendorid,
    };

    const rSubscr = this.productOrderService.add(productorder).subscribe(
      (payload: any) => {
        // server should be returning new id
        if (typeof payload === 'number'){
        
          this.msg = `Product order ${payload} added!`
          this.pono = payload;
          this.generated = true;
        this.hasProducts = false;
        this.pickedVendor = false;
        this.pickedProduct = false;
        }
        else {
          this.msg = 'Order not added! - server error';
        }
      },
      (err: { status: any; statusText: any }) => {
        this.msg = `Error - product not added - ${err.status} - ${err.statusText}`;
      }
    );
    this.subscription?.add(rSubscr); // add it as a child, so all can be destroyed together
  } // createProductOrder

  viewPdf(): void {
    window.open(`${PDFURL}${this.selectedPo.id}`, '');
    } // viewPdf
   

} // 
